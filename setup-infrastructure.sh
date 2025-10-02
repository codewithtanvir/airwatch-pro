#!/bin/bash

# AirWatch Enhanced Infrastructure Setup Script
# Sets up complete AWS infrastructure using Terraform

set -e

echo "🏗️ Setting up AirWatch Enhanced Production Infrastructure"
echo "======================================================="

# Configuration
AWS_REGION=${AWS_REGION:-us-west-2}
CLUSTER_NAME=${CLUSTER_NAME:-airwatch-production}
DOMAIN_NAME=${DOMAIN_NAME:-airwatch-enhanced.com}
ENVIRONMENT=${ENVIRONMENT:-production}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    command -v terraform >/dev/null 2>&1 || { log_error "Terraform is required but not installed. Please install it first."; exit 1; }
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed. Please install it first."; exit 1; }
    command -v kubectl >/dev/null 2>&1 || { log_error "kubectl is required but not installed. Please install it first."; exit 1; }
    command -v helm >/dev/null 2>&1 || { log_error "Helm is required but not installed. Please install it first."; exit 1; }
    
    # Check AWS credentials
    aws sts get-caller-identity >/dev/null 2>&1 || { log_error "AWS credentials not configured. Please run 'aws configure'."; exit 1; }
    
    log_success "Prerequisites check passed"
}

# Initialize Terraform
init_terraform() {
    log_info "Initializing Terraform..."
    
    cd terraform
    
    # Create S3 bucket for state if it doesn't exist
    aws s3 mb s3://airwatch-terraform-state --region $AWS_REGION 2>/dev/null || true
    aws s3api put-bucket-versioning --bucket airwatch-terraform-state --versioning-configuration Status=Enabled
    
    # Initialize Terraform
    terraform init
    
    log_success "Terraform initialized"
}

# Plan infrastructure
plan_infrastructure() {
    log_info "Planning infrastructure changes..."
    
    terraform plan \
        -var="aws_region=$AWS_REGION" \
        -var="cluster_name=$CLUSTER_NAME" \
        -var="domain_name=$DOMAIN_NAME" \
        -var="environment=$ENVIRONMENT" \
        -out=tfplan
    
    log_success "Infrastructure plan created"
}

# Apply infrastructure
apply_infrastructure() {
    log_info "Applying infrastructure changes..."
    
    terraform apply tfplan
    
    # Get outputs
    CLUSTER_NAME=$(terraform output -raw cluster_name)
    CLUSTER_ENDPOINT=$(terraform output -raw cluster_endpoint)
    ALB_DNS=$(terraform output -raw alb_dns_name)
    
    log_success "Infrastructure applied successfully"
    log_info "Cluster Name: $CLUSTER_NAME"
    log_info "Cluster Endpoint: $CLUSTER_ENDPOINT"
    log_info "Load Balancer DNS: $ALB_DNS"
}

# Configure kubectl
configure_kubectl() {
    log_info "Configuring kubectl..."
    
    aws eks update-kubeconfig --region $AWS_REGION --name $CLUSTER_NAME
    
    # Test kubectl connection
    kubectl get nodes
    
    log_success "kubectl configured successfully"
}

# Install AWS Load Balancer Controller
install_alb_controller() {
    log_info "Installing AWS Load Balancer Controller..."
    
    # Download IAM policy
    curl -o iam_policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/v2.5.4/docs/install/iam_policy.json
    
    # Create IAM policy
    aws iam create-policy \
        --policy-name AWSLoadBalancerControllerIAMPolicy \
        --policy-document file://iam_policy.json >/dev/null 2>&1 || true
    
    # Create service account
    eksctl create iamserviceaccount \
        --cluster=$CLUSTER_NAME \
        --namespace=kube-system \
        --name=aws-load-balancer-controller \
        --role-name AmazonEKSLoadBalancerControllerRole \
        --attach-policy-arn=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):policy/AWSLoadBalancerControllerIAMPolicy \
        --approve \
        --override-existing-serviceaccounts
    
    # Install using Helm
    helm repo add eks https://aws.github.io/eks-charts
    helm repo update
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
        -n kube-system \
        --set clusterName=$CLUSTER_NAME \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller \
        --set region=$AWS_REGION \
        --set vpcId=$(terraform output -raw vpc_id)
    
    log_success "AWS Load Balancer Controller installed"
}

# Install monitoring stack
install_monitoring() {
    log_info "Installing monitoring stack..."
    
    # Add Helm repositories
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo update
    
    # Create monitoring namespace
    kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Prometheus
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
        --set grafana.adminPassword=admin123 \
        --set grafana.service.type=LoadBalancer
    
    log_success "Monitoring stack installed"
}

# Install cert-manager
install_cert_manager() {
    log_info "Installing cert-manager..."
    
    # Add Helm repository
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    # Create namespace
    kubectl create namespace cert-manager --dry-run=client -o yaml | kubectl apply -f -
    
    # Install cert-manager
    helm install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --set installCRDs=true
    
    log_success "cert-manager installed"
}

# Setup DNS
setup_dns() {
    log_info "Setting up DNS..."
    
    # Get Route53 hosted zone ID
    HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name $DOMAIN_NAME --query "HostedZones[0].Id" --output text | cut -d'/' -f3)
    
    if [ "$HOSTED_ZONE_ID" = "None" ]; then
        log_warning "Route53 hosted zone for $DOMAIN_NAME not found. Please create it manually."
        return
    fi
    
    # Create Route53 record pointing to ALB
    cat > route53-record.json <<EOF
{
    "Changes": [{
        "Action": "UPSERT",
        "ResourceRecordSet": {
            "Name": "$DOMAIN_NAME",
            "Type": "A",
            "AliasTarget": {
                "DNSName": "$ALB_DNS",
                "EvaluateTargetHealth": true,
                "HostedZoneId": "$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?DNSName==`'$ALB_DNS'`].CanonicalHostedZoneId' --output text)"
            }
        }
    }]
}
EOF
    
    aws route53 change-resource-record-sets \
        --hosted-zone-id $HOSTED_ZONE_ID \
        --change-batch file://route53-record.json
    
    log_success "DNS configured"
}

# Deploy secrets
deploy_secrets() {
    log_info "Deploying secrets..."
    
    # Create namespace
    kubectl create namespace airwatch --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secret from AWS Secrets Manager
    kubectl create secret generic app-secrets \
        --namespace=airwatch \
        --from-literal=database-url="$(aws secretsmanager get-secret-value --secret-id $CLUSTER_NAME-secrets --query SecretString --output text | jq -r .database_url)" \
        --from-literal=redis-url="$(aws secretsmanager get-secret-value --secret-id $CLUSTER_NAME-secrets --query SecretString --output text | jq -r .redis_url)" \
        --from-literal=jwt-secret="$(aws secretsmanager get-secret-value --secret-id $CLUSTER_NAME-secrets --query SecretString --output text | jq -r .jwt_secret)" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    log_success "Secrets deployed"
}

# Deploy application
deploy_application() {
    log_info "Deploying AirWatch Enhanced application..."
    
    cd ..
    
    # Update image tags in Kubernetes manifests
    sed -i "s|IMAGE_TAG|latest|g" k8s/production-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f k8s/ -n airwatch
    
    # Wait for deployment
    kubectl rollout status deployment/airwatch-frontend -n airwatch
    kubectl rollout status deployment/airwatch-backend -n airwatch
    kubectl rollout status deployment/airwatch-ml -n airwatch
    
    log_success "Application deployed successfully"
}

# Setup autoscaling
setup_autoscaling() {
    log_info "Setting up autoscaling..."
    
    # Install Cluster Autoscaler
    helm repo add autoscaler https://kubernetes.github.io/autoscaler
    helm install cluster-autoscaler autoscaler/cluster-autoscaler \
        --namespace kube-system \
        --set 'autoDiscovery.clusterName'=$CLUSTER_NAME \
        --set 'awsRegion'=$AWS_REGION \
        --set 'rbac.serviceAccount.annotations.eks\.amazonaws\.com/role-arn'=arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/AmazonEKSClusterAutoscalerRole
    
    # Apply HPA configurations
    kubectl apply -f - <<EOF
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: airwatch-backend-hpa
  namespace: airwatch
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: airwatch-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
EOF
    
    log_success "Autoscaling configured"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to be ready
    sleep 60
    
    # Check pod status
    kubectl get pods -n airwatch
    
    # Check service status
    kubectl get services -n airwatch
    
    # Test application endpoints
    FRONTEND_URL="https://$DOMAIN_NAME"
    API_URL="https://$DOMAIN_NAME/api"
    
    log_info "Testing application endpoints..."
    
    # Test frontend (might take a few minutes for DNS to propagate)
    for i in {1..10}; do
        if curl -f -s "$FRONTEND_URL" >/dev/null; then
            log_success "Frontend is accessible at $FRONTEND_URL"
            break
        else
            log_info "Waiting for frontend to be accessible... ($i/10)"
            sleep 30
        fi
    done
    
    # Test API health endpoint
    for i in {1..10}; do
        if curl -f -s "$API_URL/health" >/dev/null; then
            log_success "API is accessible at $API_URL"
            break
        else
            log_info "Waiting for API to be accessible... ($i/10)"
            sleep 30
        fi
    done
    
    log_success "Health checks completed"
}

# Display deployment summary
show_deployment_summary() {
    echo ""
    echo "🎉 AirWatch Enhanced Infrastructure Deployment Complete!"
    echo "======================================================="
    echo ""
    echo "📋 Deployment Summary:"
    echo "  Environment:      $ENVIRONMENT"
    echo "  AWS Region:       $AWS_REGION"
    echo "  Cluster Name:     $CLUSTER_NAME"
    echo "  Domain:           $DOMAIN_NAME"
    echo ""
    echo "🌐 Application URLs:"
    echo "  Frontend:         https://$DOMAIN_NAME"
    echo "  API:              https://$DOMAIN_NAME/api"
    echo "  Health Check:     https://$DOMAIN_NAME/api/health"
    echo ""
    echo "📊 Monitoring URLs:"
    echo "  Grafana:          http://$(kubectl get svc -n monitoring prometheus-grafana -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"
    echo "  Prometheus:       http://$(kubectl get svc -n monitoring prometheus-kube-prometheus-prometheus -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'):9090"
    echo ""
    echo "🔧 Management Commands:"
    echo "  View pods:        kubectl get pods -n airwatch"
    echo "  View logs:        kubectl logs -f deployment/airwatch-backend -n airwatch"
    echo "  Scale app:        kubectl scale deployment airwatch-backend --replicas=5 -n airwatch"
    echo "  Update config:    kubectl edit configmap airwatch-config -n airwatch"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  Check events:     kubectl get events -n airwatch --sort-by='.lastTimestamp'"
    echo "  Describe pod:     kubectl describe pod <pod-name> -n airwatch"
    echo "  Pod shell:        kubectl exec -it <pod-name> -n airwatch -- /bin/bash"
    echo ""
    echo "🔄 Update Application:"
    echo "  1. Build new images: docker build -t airwatch-backend:v1.1 ."
    echo "  2. Push to registry: docker push airwatch-backend:v1.1"
    echo "  3. Update deployment: kubectl set image deployment/airwatch-backend backend=airwatch-backend:v1.1 -n airwatch"
    echo ""
    echo "💰 Cost Optimization:"
    echo "  - Use Spot instances for non-critical workloads"
    echo "  - Enable cluster autoscaler for dynamic scaling"
    echo "  - Monitor costs with AWS Cost Explorer"
    echo "  - Set up billing alerts"
    echo ""
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f iam_policy.json route53-record.json
}

# Main deployment flow
main() {
    log_info "Starting infrastructure deployment..."
    
    case "$1" in
        "init")
            check_prerequisites
            init_terraform
            ;;
        "plan")
            check_prerequisites
            plan_infrastructure
            ;;
        "apply")
            check_prerequisites
            apply_infrastructure
            configure_kubectl
            ;;
        "deploy")
            check_prerequisites
            init_terraform
            plan_infrastructure
            apply_infrastructure
            configure_kubectl
            install_alb_controller
            install_monitoring
            install_cert_manager
            setup_dns
            deploy_secrets
            deploy_application
            setup_autoscaling
            run_health_checks
            show_deployment_summary
            ;;
        "destroy")
            log_warning "This will destroy all infrastructure. Are you sure? (y/N)"
            read -r response
            if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
                terraform destroy \
                    -var="aws_region=$AWS_REGION" \
                    -var="cluster_name=$CLUSTER_NAME" \
                    -var="domain_name=$DOMAIN_NAME" \
                    -var="environment=$ENVIRONMENT"
            fi
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [command]"
            echo ""
            echo "Commands:"
            echo "  init       Initialize Terraform only"
            echo "  plan       Plan infrastructure changes"
            echo "  apply      Apply infrastructure changes"
            echo "  deploy     Full deployment (recommended)"
            echo "  destroy    Destroy all infrastructure"
            echo "  help       Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  AWS_REGION     AWS region (default: us-west-2)"
            echo "  CLUSTER_NAME   EKS cluster name (default: airwatch-production)"
            echo "  DOMAIN_NAME    Application domain (default: airwatch-enhanced.com)"
            echo "  ENVIRONMENT    Environment name (default: production)"
            exit 0
            ;;
        "")
            # Default to full deployment
            main "deploy"
            ;;
        *)
            log_error "Unknown command: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
    
    cleanup
}

# Trap cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
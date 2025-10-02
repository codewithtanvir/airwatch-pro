import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Satellite, 
  Globe, 
  Eye, 
  Zap, 
  Clock, 
  Target, 
  TrendingUp, 
  Users, 
  Shield, 
  BookOpen,
  ExternalLink,
  CheckCircle,
  Info,
  Lightbulb,
  Award,
  Rocket
} from 'lucide-react';

export default function TEMPOEducationalContent() {
  const openNASALink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Satellite className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">About TEMPO Satellite</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Learn about NASA's revolutionary TEMPO satellite and how it transforms air quality monitoring 
          with real-time atmospheric chemistry observations from space.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
          <TabsTrigger value="technology" className="text-sm">Technology</TabsTrigger>
          <TabsTrigger value="benefits" className="text-sm">Benefits</TabsTrigger>
          <TabsTrigger value="science" className="text-sm">Science</TabsTrigger>
          <TabsTrigger value="future" className="text-sm">Future</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                What is TEMPO?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Mission Overview</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    TEMPO (Tropospheric Emissions: Monitoring of Pollution) is NASA's first Earth-observing 
                    instrument hosted on a commercial communications satellite in geostationary orbit. 
                    Launched in 2023, it provides unprecedented hourly observations of air pollution 
                    across North America.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Key Facts</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>First geostationary air quality satellite</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Hourly daytime observations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>8.4 km × 4.4 km spatial resolution</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Covers entire North America</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Revolutionary Impact:</strong> TEMPO provides the first continuous, 
                  high-resolution view of air pollution from space, enabling real-time tracking 
                  of emissions sources and pollution transport across entire continents.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <div className="text-center">
                <Globe className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-semibold text-blue-800">Geostationary Orbit</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Stays fixed above North America, providing continuous monitoring
                </p>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <div className="text-center">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-semibold text-green-800">Hourly Updates</h4>
                <p className="text-sm text-green-700 mt-1">
                  New observations every hour during daylight
                </p>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <div className="text-center">
                <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-semibold text-purple-800">High Resolution</h4>
                <p className="text-sm text-purple-700 mt-1">
                  Detailed view down to neighborhood scale
                </p>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                How TEMPO Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Spectrometer Technology</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    TEMPO uses an imaging spectrometer that measures ultraviolet and visible light 
                    reflected from Earth's atmosphere. Different gases absorb specific wavelengths 
                    of light, creating unique "fingerprints" that allow scientists to identify 
                    and quantify atmospheric pollutants.
                  </p>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-2">Measured Pollutants</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span>NO₂ (Nitrogen Dioxide)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>O₃ (Ozone)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>HCHO (Formaldehyde)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>SO₂ (Sulfur Dioxide)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Orbital Mechanics</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    TEMPO is hosted on the Intelsat 40e commercial satellite at 36,000 km above 
                    the equator. This geostationary position allows it to maintain a constant 
                    view of North America, from Mexico to northern Canada and from the Pacific 
                    to the Atlantic.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Altitude:</span>
                      <span className="font-medium">35,786 km</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Orbital Period:</span>
                      <span className="font-medium">24 hours</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Coverage Area:</span>
                      <span className="font-medium">North America</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Observation Frequency:</span>
                      <span className="font-medium">Hourly (daylight)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Data Processing & Quality
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-blue-800 mb-2">Level 1 Processing</h5>
                  <p className="text-xs text-blue-700">
                    Raw spectral data is calibrated and georeferenced to create 
                    radiance measurements with precise location information.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h5 className="font-medium text-green-800 mb-2">Level 2 Processing</h5>
                  <p className="text-xs text-green-700">
                    Atmospheric algorithms convert radiance data into pollutant 
                    concentrations with quality flags and uncertainty estimates.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h5 className="font-medium text-purple-800 mb-2">Level 3 Processing</h5>
                  <p className="text-xs text-purple-700">
                    Data is gridded, averaged, and combined with other sources 
                    to create analysis-ready products for applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benefits" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Why TEMPO is Revolutionary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-700">Advantages Over Ground Stations</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs">
                        Coverage
                      </Badge>
                      <span>Monitors entire regions simultaneously, not just point locations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs">
                        Transport
                      </Badge>
                      <span>Tracks pollution movement across borders and between cities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs">
                        Sources
                      </Badge>
                      <span>Identifies emission sources including power plants, traffic, wildfires</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-2 py-1 text-xs">
                        Rural Areas
                      </Badge>
                      <span>Provides data where no ground monitoring stations exist</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-blue-700">Real-World Applications</h4>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Public Health:</strong> Early warning of pollution episodes and exposure assessment</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Environmental Justice:</strong> Identifying pollution disparities in communities</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Policy Making:</strong> Evidence-based air quality regulations and enforcement</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Eye className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span><strong>Climate Research:</strong> Understanding atmospheric chemistry and climate interactions</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-orange-200 bg-orange-50">
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              <strong>Complementary Data:</strong> TEMPO doesn't replace ground stations—it enhances them! 
              Ground stations provide precise local measurements, while TEMPO reveals the bigger picture 
              of regional pollution patterns and transport.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="science" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                The Science Behind TEMPO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Atmospheric Chemistry Detection</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  TEMPO measures the vertical column density of trace gases—the total amount of a gas 
                  in a column of air from the satellite to the ground. This measurement technique, 
                  called Differential Optical Absorption Spectroscopy (DOAS), has been used successfully 
                  from space for decades but never with TEMPO's temporal resolution.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-3">NO₂ (Nitrogen Dioxide)</h5>
                    <ul className="text-xs space-y-1 text-blue-700">
                      <li>• Primary indicator of traffic and industrial emissions</li>
                      <li>• Precursor to ozone formation</li>
                      <li>• Directly harmful to respiratory health</li>
                      <li>• Short atmospheric lifetime (~hours)</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-3">HCHO (Formaldehyde)</h5>
                    <ul className="text-xs space-y-1 text-green-700">
                      <li>• Indicator of volatile organic compounds (VOCs)</li>
                      <li>• Marker for wildfire and industrial emissions</li>
                      <li>• Cancer-causing air toxic</li>
                      <li>• Precursor to ozone and particulate matter</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Data Quality & Uncertainty</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Every TEMPO measurement includes quality flags and uncertainty estimates. 
                  Data quality depends on factors like cloud cover, surface reflectance, 
                  viewing geometry, and atmospheric conditions. AirWatch uses only 
                  high-quality measurements for health recommendations.
                </p>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">±15%</div>
                    <div className="text-xs text-green-700">NO₂ Precision</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">±40%</div>
                    <div className="text-xs text-blue-700">HCHO Precision</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">8.4×4.4</div>
                    <div className="text-xs text-purple-700">km Resolution</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="future" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                The Future of Air Quality Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Global Constellation</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  TEMPO is part of a revolutionary global air quality monitoring constellation. 
                  Together with Europe's Sentinel-4 and Asia's GEMS satellites, this network 
                  will provide continuous, global coverage of air pollution for the first time 
                  in human history.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Satellite className="w-4 h-4 text-blue-600" />
                      <h5 className="font-medium text-blue-800">TEMPO (USA)</h5>
                    </div>
                    <p className="text-xs text-blue-700">North America coverage, operational since 2023</p>
                  </div>
                  
                  <div className="p-4 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Satellite className="w-4 h-4 text-green-600" />
                      <h5 className="font-medium text-green-800">Sentinel-4 (EU)</h5>
                    </div>
                    <p className="text-xs text-green-700">Europe coverage, planned for 2025</p>
                  </div>
                  
                  <div className="p-4 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Satellite className="w-4 h-4 text-purple-600" />
                      <h5 className="font-medium text-purple-800">GEMS (Korea)</h5>
                    </div>
                    <p className="text-xs text-purple-700">Asia coverage, operational since 2020</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold">Technology Advancement</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium mb-2">Enhanced Capabilities</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Higher spatial resolution instruments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Additional atmospheric chemistry parameters</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Improved data processing algorithms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Real-time data dissemination</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Application Evolution</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>AI-powered air quality forecasting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>Personalized exposure assessments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>Emission source attribution</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span>Climate-health impact modeling</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button 
              onClick={() => openNASALink('https://tempo.si.edu/')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Learn More at NASA TEMPO
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
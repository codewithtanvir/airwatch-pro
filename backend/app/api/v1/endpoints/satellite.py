from fastapi import APIRouter

router = APIRouter()

@router.get("/tempo")
async def get_tempo_data(latitude: float, longitude: float):
    return {
        "success": True,
        "message": "NASA TEMPO endpoint ready for hackathon demo"
    }

from fastapi import APIRouter

router = APIRouter(prefix="/v1/app/humans")


@router.get("")
def custom_list_humans():
    return [
        {
            "id": 999,
            "first_name": "Override",
            "last_name": "Backend",
            "message": "This data came from the custom routers/humans.py file!",
        }
    ]

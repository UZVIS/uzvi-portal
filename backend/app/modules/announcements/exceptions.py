from fastapi import HTTPException
from starlette import status


class AnnouncementNotFoundException(
    HTTPException
):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )


class AlreadyAcknowledgedException(
    HTTPException
):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Announcement already acknowledged"
        )


class InvalidTargetException(
    HTTPException
):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target type"
        )


class AnnouncementExpiredException(
    HTTPException
):

    def __init__(self):

        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Announcement has expired"
        )
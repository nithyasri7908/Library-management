from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # to get the standard error response.
    response = exception_handler(exc, context)

    # Now add the HTTP status code to the response.
    if response is not None and isinstance(exc, ValidationError):
        # Check if the error is due to uniqueness constraint
        is_conflict = False
        for field, errors in response.data.items():
            if isinstance(errors, list):
                for error in errors:
                    if 'duplicate' in str(error).lower() or 'already exists' in str(error).lower():
                        is_conflict = True
                        break
        
        if is_conflict:
            response.status_code = status.HTTP_409_CONFLICT
            
    return response

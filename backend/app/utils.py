from sqlalchemy.orm import Session
from sqlalchemy import desc

def generate_prefixed_id(db: Session, model_class, id_column_name: str, prefix: str):
    last_record = db.query(model_class).order_by(desc(getattr(model_class, id_column_name))).first()
    
    if not last_record:
        return f"{prefix}001"
    
    last_id = getattr(last_record, id_column_name)
    last_number = int(last_id.replace(prefix, ""))
    
    return f"{prefix}{last_number + 1:03d}"
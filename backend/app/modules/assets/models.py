from sqlalchemy import Column, String, ForeignKey, Date
from sqlalchemy.orm import relationship

from app.database import Base

class Asset(Base):
    __tablename__ = "assets"

    asset_id = Column(String, primary_key=True, index=True, nullable=False)
    tag = Column(String, unique=True, index=True, nullable=False)
    asset_type = Column(String, nullable=False)
    purchase_date = Column(Date, nullable=False)   # New field
    status = Column(String, nullable=False)
    assignments = relationship(
    "AssetAssignment",
    back_populates="asset",
    cascade="all, delete-orphan"
)

class AssetAssignment(Base):
    __tablename__ = "asset_assignments"

    assignment_id = Column(
        String,
        primary_key=True,
        index=True,
        nullable=False
    )

    asset_id = Column(
        String,
        ForeignKey("assets.asset_id"),
        nullable=False
    )

    employee_id = Column(
        String,
        nullable=False
    )

    assigned_date = Column(
        Date,
        nullable=False
    )

    returned_date = Column(
        Date,
        nullable=True
    )

    remarks = Column(
        String,
        nullable=True
    )

    asset = relationship(
        "Asset",
        back_populates="assignments"
    )
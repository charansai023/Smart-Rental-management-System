from sqlalchemy import Column, String, Float
from database import Base


class Site(Base):
    __tablename__ = "sites"

    site_id = Column(String, primary_key=True)      # e.g. S001
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

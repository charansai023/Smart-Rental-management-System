from sqlalchemy import Column, String
from database import Base


class Operator(Base):
    __tablename__ = "operators"

    operator_id = Column(String, primary_key=True)  # e.g. OP101
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)

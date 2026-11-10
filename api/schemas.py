from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


class ClientData(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        extra="forbid"
    )

    age: int = Field(ge=0, le=120)

    job: str = Field(min_length=1)
    marital: str = Field(min_length=1)
    education: str = Field(min_length=1)
    default: Literal["yes", "no", "unknown"]
    housing: Literal["yes", "no", "unknown"]
    loan: Literal["yes", "no", "unknown"]

    contact: Literal["cellular", "telephone"]
    month: Literal[
        "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec"
    ]
    dayOfWeek: Literal["mon", "tue", "wed", "thu", "fri"] = Field(
        alias="day_of_week"
    )

    campaign: int = Field(ge=1)
    pdays: int = Field(ge=0)
    previous: int = Field(ge=0)
    poutcome: Literal["failure", "nonexistent", "success"]

    empVarRate: float = Field(alias="emp.var.rate")
    consPriceIdx: float = Field(alias="cons.price.idx")
    consConfIdx: float = Field(alias="cons.conf.idx")
    euribor3m: float
    nrEmployed: float = Field(alias="nr.employed")
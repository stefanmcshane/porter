import React, { useState } from "react";

import DatePicker from "react-datepicker";
import time from "assets/time.svg";

import styled from "styled-components";

type Props = {
  startDate: any;
  setStartDate: any;
};

const DateTimePicker: React.FC<Props> = ({ startDate, setStartDate }) => {
  return (
    <DateTimePickerWrapper>
      <TimeIcon src={time} />
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/react-datepicker/2.14.1/react-datepicker.min.css"
      />
      <Bar />
      <StyledDatePicker
        selected={startDate}
        onChange={(date: any) => setStartDate(date)}
        showTimeSelect
        dateFormat="MMMM d, yyyy h:mm aa"
      />
    </DateTimePickerWrapper>
  );
};

export default DateTimePicker;

const Bar = styled.div`
  width: 1px;
  height: calc(18px);
  background: #494b4f;
  margin-left: 8px;
`;

const TimeIcon = styled.img`
  width: 16px;
  height: 16px;
  z-index: 999;
`;

const Div = styled.div`
  display: block;
`;

const DateTimePickerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: 42px;
  margin-right: 10px;
  padding-left: 8px;
  height: 30px;
  border-radius: 5px;
  border: 1px solid #494b4f;
  height: 30px;
  background: #26292e;
`;

const StyledDatePicker = styled(DatePicker)`
  border: 0;
  width: calc(100% + 42px);
  position: relative;
  border: none;
  margin-bottom: 3px;
  outline-width: 0;
  background: transparent;
  text-align: center;
  padding: 0 15px;
  font-size: 13px;
`;

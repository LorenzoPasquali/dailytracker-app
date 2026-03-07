import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ptBR } from 'date-fns/locale';

registerLocale('pt-BR', ptBR);

export default function DateFilterModal({ show, handleClose, onApplyFilter, initialDateRange }) {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        if (initialDateRange && initialDateRange[0]) {
            setStartDate(new Date(initialDateRange[0]));
            setEndDate(initialDateRange[1] ? new Date(initialDateRange[1]) : null);
        } else {
            setStartDate(null);
            setEndDate(null);
        }
    }, [initialDateRange, show]);

    const onChange = (dates) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
    };

    const handleApply = () => {
        onApplyFilter([startDate, endDate]);
        handleClose();
    };

    const handleReset = () => {
        setStartDate(null);
        setEndDate(null);
        onApplyFilter([null, null]);
        handleClose();
    };

    const modalStyle = {
        backgroundColor: 'rgba(13, 17, 23, 0.95)',
        backdropFilter: 'blur(10px)',
        color: '#c9d1d9',
        borderRadius: '16px',
        border: '1px solid #30363d',
    };

    return (
        <Modal show={show} onHide={handleClose} centered contentClassName="bg-transparent border-0">
            <div style={modalStyle}>
                <Modal.Header closeButton closeVariant="white" className="border-secondary">
                    <Modal.Title>Filtrar por Data</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex justify-content-center">
                    <style>
                        {`
              .react-datepicker {
                background-color: transparent;
                color: #c9d1d9;
                border: none;
                font-family: inherit;
                font-size: 1.1rem;
              }
              .react-datepicker__header {
                background-color: transparent;
                border-bottom: 1px solid #30363d;
              }
              .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker__year-header {
                color: #c9d1d9;
                font-size: 1.2rem;
                padding-bottom: 1rem;
              }
              .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
                color: #c9d1d9;
                width: 3rem;
                line-height: 3rem;
                margin: 0.2rem;
              }
              .react-datepicker__day:hover {
                background-color: #30363d;
                border-radius: 50%;
              }
              .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range {
                background-color: #238636;
                color: white;
                border-radius: 50%;
              }
              .react-datepicker__day--keyboard-selected {
                background-color: #1f6feb;
                border-radius: 50%;
              }
              .react-datepicker__month-container {
                  float: none;
              }
            `}
                    </style>
                    <DatePicker
                        selected={startDate}
                        onChange={onChange}
                        startDate={startDate}
                        endDate={endDate}
                        selectsRange
                        inline
                        locale="pt-BR"
                    />
                </Modal.Body>
                <Modal.Footer className="border-secondary">
                    <Button variant="outline-danger" onClick={handleReset}>
                        Resetar
                    </Button>
                    <Button variant="success" onClick={handleApply}>
                        Filtrar
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    );
}

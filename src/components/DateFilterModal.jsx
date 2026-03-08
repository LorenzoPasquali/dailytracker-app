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

    return (
        <Modal show={show} onHide={handleClose} centered contentClassName="bg-transparent border-0">
            <div className="custom-modal-content">
                <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
                    <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>Filtrar por Data</Modal.Title>
                </Modal.Header>
                <Modal.Body className="d-flex justify-content-center">
                    <style>
                        {`
              .react-datepicker {
                background-color: transparent;
                color: var(--text-secondary);
                border: none;
                font-family: var(--font-body);
                font-size: 1rem;
              }
              .react-datepicker__header {
                background-color: transparent;
                border-bottom: 1px solid var(--border-subtle);
              }
              .react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker__year-header {
                color: var(--text-primary);
                font-size: 1.05rem;
                font-weight: 600;
                padding-bottom: 0.75rem;
              }
              .react-datepicker__day-name, .react-datepicker__day, .react-datepicker__time-name {
                color: var(--text-secondary);
                width: 2.8rem;
                line-height: 2.8rem;
                margin: 0.15rem;
                font-size: 0.85rem;
              }
              .react-datepicker__day-name {
                color: var(--text-muted);
                font-weight: 500;
                font-size: 0.75rem;
              }
              .react-datepicker__day:hover {
                background-color: var(--bg-hover);
                border-radius: 50%;
              }
              .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range {
                background-color: var(--accent) !important;
                color: var(--bg-base) !important;
                border-radius: 50%;
                font-weight: 600;
              }
              .react-datepicker__day--keyboard-selected {
                background-color: var(--accent-subtle);
                border-radius: 50%;
              }
              .react-datepicker__month-container {
                  float: none;
              }
              .react-datepicker__navigation-icon::before {
                border-color: var(--text-muted);
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
                <Modal.Footer style={{ borderColor: 'var(--border-subtle)' }}>
                    <Button
                        onClick={handleReset}
                        style={{
                            backgroundColor: 'var(--danger-subtle)',
                            border: 'none',
                            color: 'var(--danger)',
                            fontSize: '0.85rem',
                            fontWeight: 500
                        }}
                    >
                        Resetar
                    </Button>
                    <Button
                        onClick={handleApply}
                        style={{
                            backgroundColor: 'var(--accent)',
                            border: 'none',
                            color: 'var(--bg-base)',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                        }}
                    >
                        Filtrar
                    </Button>
                </Modal.Footer>
            </div>
        </Modal>
    );
}

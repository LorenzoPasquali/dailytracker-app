import React, { useContext } from 'react';
import { Nav, Accordion, useAccordionButton, AccordionContext, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { HouseDoorFill, CollectionFill, BarChartFill, Folder, TagFill, ChevronDown, ChevronUp } from 'react-bootstrap-icons';

function CustomToggle({ children, eventKey, isCollapsed, onToggleCollapse }) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey);
  const isCurrentEventKey = activeEventKey === eventKey;

  const handleClick = (e) => {
    e.preventDefault();
    if (isCollapsed) {
      onToggleCollapse();
    }
    decoratedOnClick();
  };

  if (isCollapsed) {
    return (
      <div
        onClick={handleClick}
        role="button"
        className="p-3 d-flex justify-content-center align-items-center text-secondary"
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="d-flex justify-content-between align-items-center p-3 text-secondary"
      onClick={handleClick}
      role="button"
    >
      <div className="d-flex align-items-center">
        {children}
      </div>
      {isCurrentEventKey ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </div>
  );
}

export default function Sidebar({ onProjectsClick, onTaskTypesClick, isCollapsed, onToggleCollapse, isMobile }) {
  const sidebarStyle = {
    width: isCollapsed ? '60px' : '260px',
    backgroundColor: 'rgba(13, 17, 23, 0.65)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    zIndex: 2,
    transition: 'width 0.3s ease-in-out',
    overflowX: 'hidden',
  };

  const activeLinkStyle = {
    borderLeft: '3px solid #3b82f6',
    background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(13, 17, 23, 0) 100%)',
    boxShadow: 'inset 4px 0 8px -4px rgba(59, 130, 246, 0.5)',
  };

  return (
    <div style={sidebarStyle} className={`h-100 d-flex flex-column flex-shrink-0 ${!isMobile ? 'border-end border-secondary' : ''}`}>
      <Nav className="flex-column nav-pills flex-grow-1" style={{ whiteSpace: 'nowrap', paddingTop: '1rem' }}>
        <Nav.Link
          href="#"
          className="text-light d-flex align-items-center p-3"
          style={activeLinkStyle}
          onClick={isCollapsed ? onToggleCollapse : null}
        >
          <HouseDoorFill className={`flex-shrink-0 ${!isCollapsed ? 'me-2' : ''}`} />
          {!isCollapsed && "Monitor de Tarefas"}
        </Nav.Link>

        <Accordion>
          <CustomToggle eventKey="0" isCollapsed={isCollapsed} onToggleCollapse={onToggleCollapse}>
            <CollectionFill className={`flex-shrink-0 ${!isCollapsed ? 'me-2' : ''}`} />
            {!isCollapsed && "Cadastros"}
          </CustomToggle>
          {!isCollapsed && (
            <Accordion.Collapse eventKey="0">
              <div>
                <Nav.Link onClick={onProjectsClick} className="text-secondary d-flex align-items-center py-2 ps-5" role="button">
                  <Folder className="me-2" /> Projetos
                </Nav.Link>
                <Nav.Link onClick={onTaskTypesClick} className="text-secondary d-flex align-items-center py-2 ps-5" role="button">
                  <TagFill className="me-2" /> Tipos de Tarefa
                </Nav.Link>
              </div>
            </Accordion.Collapse>
          )}
        </Accordion>

        <OverlayTrigger
          placement="right"
          delay={{ show: 250, hide: 400 }}
          overlay={
            <Tooltip id="tooltip-reports">
              Módulo de Relatórios ainda não implementado
            </Tooltip>
          }
        >
          <div className="nav-link text-secondary d-flex align-items-center p-3 nav-link-no-action">
            <BarChartFill className={`flex-shrink-0 ${!isCollapsed ? 'me-2' : ''}`} />
            {!isCollapsed && "Relatórios"}
          </div>
        </OverlayTrigger>
      </Nav>
    </div>
  );
}
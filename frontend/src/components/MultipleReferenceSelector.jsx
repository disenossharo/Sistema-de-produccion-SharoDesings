import React, { useState, useEffect, useMemo } from 'react';
import { Form, Card, Row, Col, Badge, Button, InputGroup, Alert } from 'react-bootstrap';
import { FaSearch, FaTag, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';

const MultipleReferenceSelector = ({ 
  selectedReferences = [], 
  onChange, 
  referencias = [], 
  placeholder = "Buscar referencias...",
  maxHeight = "300px"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Filtrar referencias basado en el término de búsqueda
  const filteredReferences = useMemo(() => {
    if (!searchTerm.trim()) {
      return referencias.filter(ref => ref.activa).slice(0, 20);
    }
    
    const term = searchTerm.toLowerCase().trim();
    return referencias
      .filter(ref => ref.activa)
      .filter(ref => 
        ref.codigo.toLowerCase().includes(term) ||
        ref.nombre.toLowerCase().includes(term) ||
        (ref.descripcion && ref.descripcion.toLowerCase().includes(term))
      )
      .slice(0, 50);
  }, [referencias, searchTerm]);

  // Verificar si una referencia está seleccionada
  const isSelected = (referenceId) => {
    return selectedReferences.some(ref => ref.id === referenceId);
  };

  // Manejar selección/deselección de referencia
  const handleToggleReference = (reference) => {
    if (isSelected(reference.id)) {
      // Remover de seleccionadas
      const newSelection = selectedReferences.filter(ref => ref.id !== reference.id);
      onChange(newSelection);
    } else {
      // Agregar a seleccionadas
      const newSelection = [...selectedReferences, reference];
      onChange(newSelection);
    }
  };

  // Remover referencia específica
  const handleRemoveReference = (referenceId) => {
    const newSelection = selectedReferences.filter(ref => ref.id !== referenceId);
    onChange(newSelection);
  };

  // Limpiar todas las selecciones
  const handleClearAll = () => {
    onChange([]);
  };

  // Seleccionar todas las referencias filtradas
  const handleSelectAll = () => {
    const newSelections = [...selectedReferences];
    filteredReferences.forEach(ref => {
      if (!isSelected(ref.id)) {
        newSelections.push(ref);
      }
    });
    onChange(newSelections);
  };

  // Deseleccionar todas las referencias filtradas
  const handleDeselectAll = () => {
    const filteredIds = filteredReferences.map(ref => ref.id);
    const newSelection = selectedReferences.filter(ref => !filteredIds.includes(ref.id));
    onChange(newSelection);
  };

  return (
    <div>
      {/* Campo de búsqueda */}
      <InputGroup className="mb-3">
        <InputGroup.Text style={{ background: '#f8f9fa', borderRight: 'none' }}>
          <FaSearch style={{ color: '#6c757d' }} />
        </InputGroup.Text>
        <Form.Control
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder={placeholder}
          style={{
            borderLeft: 'none',
            borderRight: 'none'
          }}
        />
        <InputGroup.Text 
          style={{ 
            background: '#e3f0ff', 
            borderLeft: 'none',
            cursor: 'pointer',
            color: '#0d6efd'
          }}
          onClick={() => setSearchTerm('')}
          title="Limpiar búsqueda"
        >
          ✕
        </InputGroup.Text>
      </InputGroup>

      {/* Referencias seleccionadas */}
      {selectedReferences.length > 0 && (
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <small className="text-muted fw-bold">
              Referencias seleccionadas ({selectedReferences.length})
            </small>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={handleClearAll}
              style={{ fontSize: '12px' }}
            >
              <FaTimes className="me-1" />
              Limpiar todo
            </Button>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {selectedReferences.map((ref) => (
              <Badge 
                key={ref.id} 
                bg="success" 
                style={{ fontSize: '12px', padding: '8px 12px' }}
                className="d-flex align-items-center gap-1"
              >
                <FaTag />
                <span>{ref.codigo} - {ref.nombre}</span>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    fontSize: '14px',
                    lineHeight: 1
                  }}
                  onClick={() => handleRemoveReference(ref.id)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown de referencias disponibles */}
      {showDropdown && (
        <Card 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            maxHeight: maxHeight,
            overflowY: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #dee2e6'
          }}
        >
          <Card.Header className="py-2" style={{ background: '#f8f9fa' }}>
            <div className="d-flex justify-content-between align-items-center">
              <small className="text-muted fw-bold">
                Referencias disponibles ({filteredReferences.length})
              </small>
              <div className="d-flex gap-1">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={handleSelectAll}
                  style={{ fontSize: '11px' }}
                >
                  <FaCheck className="me-1" />
                  Todas
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={handleDeselectAll}
                  style={{ fontSize: '11px' }}
                >
                  <FaTimes className="me-1" />
                  Ninguna
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            {filteredReferences.length > 0 ? (
              <div>
                {filteredReferences.map((reference) => (
                  <div
                    key={reference.id}
                    className={`p-3 border-bottom d-flex align-items-center gap-3 ${
                      isSelected(reference.id) ? 'bg-light' : ''
                    }`}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => handleToggleReference(reference)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected(reference.id) ? '#e3f0ff' : '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isSelected(reference.id) ? '#e3f0ff' : 'transparent';
                    }}
                  >
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected(reference.id)}
                        onChange={() => {}} // Manejado por el onClick del div
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </div>
                    <FaTag style={{ color: '#0d6efd', fontSize: '16px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: '#2c3e50',
                        fontSize: '14px',
                        marginBottom: '2px'
                      }}>
                        {reference.codigo}
                      </div>
                      <div style={{ 
                        color: '#6c757d',
                        fontSize: '13px',
                        marginBottom: '2px'
                      }}>
                        {reference.nombre}
                      </div>
                      {reference.descripcion && (
                        <div style={{ 
                          color: '#adb5bd',
                          fontSize: '12px',
                          fontStyle: 'italic'
                        }}>
                          {reference.descripcion.length > 60 
                            ? `${reference.descripcion.substring(0, 60)}...` 
                            : reference.descripcion
                          }
                        </div>
                      )}
                    </div>
                    <Badge 
                      bg={reference.categoria ? 'primary' : 'secondary'} 
                      style={{ fontSize: '10px' }}
                    >
                      {reference.categoria || 'Sin categoría'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted">
                <FaSearch size={24} className="mb-2" style={{ opacity: 0.5 }} />
                <div>
                  {searchTerm.trim() ? 'No se encontraron referencias' : 'Escribe para buscar referencias...'}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default MultipleReferenceSelector;

import React, { useState, useEffect, useMemo } from 'react';
import { Form, ListGroup, InputGroup, Badge } from 'react-bootstrap';
import { FaSearch, FaTag } from 'react-icons/fa';

const ReferenceSearch = ({ 
  value, 
  onChange, 
  referencias = [], 
  placeholder = "Buscar referencia por código o nombre...",
  disabled = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedReference, setSelectedReference] = useState(null);

  // Filtrar referencias basado en el término de búsqueda
  const filteredReferences = useMemo(() => {
    if (!searchTerm.trim()) {
      return referencias.filter(ref => ref.activa).slice(0, 10); // Mostrar solo las primeras 10
    }
    
    const term = searchTerm.toLowerCase().trim();
    return referencias
      .filter(ref => ref.activa)
      .filter(ref => 
        ref.codigo.toLowerCase().includes(term) ||
        ref.nombre.toLowerCase().includes(term) ||
        (ref.descripcion && ref.descripcion.toLowerCase().includes(term))
      )
      .slice(0, 20); // Limitar a 20 resultados
  }, [referencias, searchTerm]);

  // Cargar referencia seleccionada cuando cambia el value
  useEffect(() => {
    if (value && referencias.length > 0) {
      const ref = referencias.find(r => r.id === value);
      if (ref) {
        setSelectedReference(ref);
        setSearchTerm(`${ref.codigo} - ${ref.nombre}`);
      }
    } else {
      setSelectedReference(null);
      setSearchTerm('');
    }
  }, [value, referencias]);

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    setShowDropdown(true);
    
    // Si se borra el campo, limpiar la selección
    if (!newSearchTerm.trim()) {
      setSelectedReference(null);
      onChange(null);
    }
  };

  const handleReferenceSelect = (reference) => {
    setSelectedReference(reference);
    setSearchTerm(`${reference.codigo} - ${reference.nombre}`);
    setShowDropdown(false);
    onChange(reference); // Pasar el objeto completo en lugar del ID
  };

  const handleClear = () => {
    setSearchTerm('');
    setSelectedReference(null);
    setShowDropdown(false);
    onChange(null);
  };

  const handleFocus = () => {
    setShowDropdown(true);
  };

  const handleBlur = () => {
    // Delay para permitir que se ejecute el onClick del dropdown
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div style={{ position: 'relative' }}>
      <InputGroup>
        <InputGroup.Text style={{ background: '#f8f9fa', borderRight: 'none' }}>
          <FaSearch style={{ color: '#6c757d' }} />
        </InputGroup.Text>
        <Form.Control
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            borderLeft: 'none',
            borderRight: 'none'
          }}
        />
        {selectedReference && (
          <InputGroup.Text 
            style={{ 
              background: '#e3f0ff', 
              borderLeft: 'none',
              cursor: 'pointer',
              color: '#0d6efd'
            }}
            onClick={handleClear}
            title="Limpiar selección"
          >
            ✕
          </InputGroup.Text>
        )}
      </InputGroup>

      {/* Dropdown de resultados */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'white',
            border: '1px solid #dee2e6',
            borderTop: 'none',
            borderRadius: '0 0 0.375rem 0.375rem',
            boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          {filteredReferences.length > 0 ? (
            <ListGroup variant="flush">
              {filteredReferences.map((reference) => (
                <ListGroup.Item
                  key={reference.id}
                  action
                  onClick={() => handleReferenceSelect(reference)}
                  style={{
                    cursor: 'pointer',
                    border: 'none',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <FaTag style={{ color: '#0d6efd', fontSize: '14px' }} />
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
                        {reference.descripcion.length > 50 
                          ? `${reference.descripcion.substring(0, 50)}...` 
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
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#6c757d',
              fontSize: '14px'
            }}>
              {searchTerm.trim() ? 'No se encontraron referencias' : 'Escribe para buscar referencias...'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReferenceSearch;

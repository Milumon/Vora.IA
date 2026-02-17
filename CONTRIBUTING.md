# Guía de Contribución - Vora

## Estándares de Código

### Python (Backend)
- Usar Black para formateo
- Usar Ruff para linting
- Seguir PEP 8
- Documentar funciones con docstrings
- Type hints obligatorios

### TypeScript (Frontend)
- Usar Prettier para formateo
- Seguir ESLint rules
- Componentes funcionales con hooks
- Props tipadas con TypeScript
- Nombres descriptivos

## Workflow de Git

1. Crear branch desde `main`:
   ```bash
   git checkout -b feature/nombre-feature
   ```

2. Hacer commits descriptivos:
   ```bash
   git commit -m "feat: descripción del cambio"
   ```

3. Push y crear Pull Request:
   ```bash
   git push origin feature/nombre-feature
   ```

## Convención de Commits

- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Cambios en documentación
- `style:` Formateo, sin cambios de código
- `refactor:` Refactorización de código
- `test:` Agregar o modificar tests
- `chore:` Tareas de mantenimiento

## Testing

### Backend
```bash
cd backend
pytest
pytest --cov=app tests/
```

### Frontend
```bash
cd frontend
npm test
npm run test:coverage
```

## Code Review

- Todos los PRs requieren revisión
- Tests deben pasar
- Linting debe pasar
- Documentación actualizada

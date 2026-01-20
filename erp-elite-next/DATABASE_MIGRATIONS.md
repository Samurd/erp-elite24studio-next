# Database Migrations - Elite ERP

Sistema de migraciones automatizado usando Drizzle ORM para gestionar cambios en la base de datos de forma segura tanto en desarrollo como en producción.

## 📋 Comandos Rápidos

```bash
# Desarrollo
npm run db:sync              # Sincronizar schema desde DB existente
npm run db:generate          # Generar migración desde cambios en schema
npm run db:migrate:dev       # Aplicar última migración en desarrollo
npm run db:studio            # Abrir Drizzle Studio (GUI)

# Producción
npm run db:migrate           # Aplicar migraciones pendientes
npm run db:status            # Ver estado de migraciones
```

## 🚀 Inicio Rápido

### Primera Vez - Sincronizar DB Existente

```bash
# 1. Generar schema TypeScript desde la base de datos actual
npm run db:sync

# 2. Commit el schema generado
git add drizzle/schema.ts drizzle/relations.ts
git commit -m "chore: initial schema sync"
```

### Agregar Campo a Tabla Existente

```bash
# 1. Editar drizzle/schema.ts
# Ejemplo: Agregar campo 'email_verified' a users

# 2. Generar migración SQL automáticamente
npm run db:generate

# 3. Aplicar en desarrollo
npm run db:migrate:dev

# 4. Probar
npm run dev

# 5. Commit
git add drizzle/
git commit -m "feat: add email_verified field"
git push

# 6. En producción (automático en CI/CD o manual)
npm run db:migrate
```

## 📖 Workflow Completo

### 1. Modificar Schema

Editar `drizzle/schema.ts`:

```typescript
export const users = mysqlTable("users", {
    id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    emailVerified: tinyint("email_verified").default(0).notNull(), // ← NUEVO
    // ... resto de campos
});
```

### 2. Generar Migración

```bash
npm run db:generate
```

Esto crea: `drizzle/migrations/0001_nombre_descriptivo.sql`

### 3. Revisar SQL Generado

```bash
cat drizzle/migrations/0001_*.sql
```

Verificar que el SQL sea correcto.

### 4. Aplicar en Desarrollo

```bash
npm run db:migrate:dev
```

### 5. Verificar

```bash
# Opción 1: GUI
npm run db:studio

# Opción 2: CLI
docker exec erp-elite-mysql mysql -u root elite -e "DESCRIBE users;"
```

### 6. Commit y Push

```bash
git add drizzle/schema.ts drizzle/migrations/
git commit -m "feat: add email_verified to users table"
git push
```

### 7. Deploy a Producción

```bash
# En servidor o CI/CD
npm run db:migrate
```

## 🛠️ Casos de Uso

### Crear Nueva Tabla

```typescript
// drizzle/schema.ts
export const posts = mysqlTable("posts", {
    id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: varchar({ length: 255 }).notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
```

```bash
npm run db:generate
npm run db:migrate:dev
```

### Modificar Columna

```typescript
// Cambiar longitud de varchar
name: varchar({ length: 500 }).notNull(), // antes: 255
```

```bash
npm run db:generate
npm run db:migrate:dev
```

### Agregar Foreign Key

```typescript
export const comments = mysqlTable("comments", {
    id: bigint({ mode: "number", unsigned: true }).autoincrement().notNull(),
    postId: bigint("post_id", { mode: "number", unsigned: true })
        .notNull()
        .references(() => posts.id, { onDelete: "cascade" }),
    // ...
});
```

```bash
npm run db:generate
npm run db:migrate:dev
```

## ⚠️ Consideraciones Importantes

### Migraciones con Datos Existentes

❌ **Evitar:**
```typescript
// Agregar columna NOT NULL sin default en tabla con datos
newField: varchar({ length: 255 }).notNull()
```

✅ **Correcto:**
```typescript
// Opción 1: Con default
newField: varchar({ length: 255 }).notNull().default('valor_default')

// Opción 2: Nullable primero, luego NOT NULL
newField: varchar({ length: 255 }) // Primero nullable
// Después de poblar datos, cambiar a NOT NULL
```

### Renombrar Columnas

Drizzle no detecta renombres automáticamente. Hacer en dos pasos:

```sql
-- 1. Crear migración manual
-- drizzle/migrations/0002_rename_column.sql
ALTER TABLE `users` RENAME COLUMN `old_name` TO `new_name`;
```

```typescript
// 2. Actualizar schema
newName: varchar("new_name", { length: 255 })
```

## 🔍 Debugging

### Ver Diferencias Pendientes

```bash
npx drizzle-kit push --dry-run
```

### Verificar Estado

```bash
npm run db:status
```

### Abrir GUI

```bash
npm run db:studio
# Abre en http://localhost:4983
```

## 📊 Estructura de Archivos

```
drizzle/
├── schema.ts              # Definición de tablas
├── relations.ts           # Relaciones entre tablas
├── index.ts              # Exports
└── migrations/           # Migraciones SQL generadas
    ├── 0001_add_email_verified.sql
    ├── 0002_create_posts_table.sql
    └── meta/             # Metadata de Drizzle
```

## 🚨 Checklist Pre-Deploy

Antes de aplicar migraciones en producción:

- [ ] Migración probada en desarrollo
- [ ] SQL revisado (no hay DROP/TRUNCATE peligrosos)
- [ ] Backup de base de datos
- [ ] Variables de entorno configuradas
- [ ] Código compatible con schema antiguo y nuevo (si deploy gradual)

## 🔧 Configuración

### Variables de Entorno

```env
# .env
DATABASE_URL="mysql://user:password@host:port/database"
```

### Drizzle Config

```typescript
// drizzle.config.ts
export default defineConfig({
    schema: ["./drizzle/schema.ts", "./drizzle/relations.ts"],
    out: "./drizzle/migrations",
    dialect: "mysql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    migrations: {
        table: "drizzle_migrations",
        schema: "public",
    },
});
```

## 📚 Recursos

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Drizzle Kit Migrations](https://orm.drizzle.team/kit-docs/overview)
- [MySQL Data Types](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)

## 🆘 Troubleshooting

### Error: "Table already exists"

```bash
# Sincronizar schema con DB actual
npm run db:sync
```

### Error: "Column not found"

```bash
# Verificar que el schema esté actualizado
npm run db:sync
```

### Migración falla en producción

```bash
# 1. Verificar logs
npm run db:status

# 2. Rollback manual si es necesario
# Crear migración inversa y aplicar

# 3. Restaurar desde backup si es crítico
```

## 👥 Contribuir

1. Siempre generar migraciones, nunca editar DB manualmente
2. Revisar SQL generado antes de aplicar
3. Probar en desarrollo antes de producción
4. Commit migraciones junto con código
5. No modificar migraciones ya aplicadas en producción

---

**Nota:** Este proyecto usa Drizzle ORM para queries y migraciones. La base de datos es compartida con la aplicación Laravel existente, por lo que todas las migraciones deben ser compatibles con ambos sistemas.

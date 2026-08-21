-- ══════════════════════════════════════════════════════════════
-- LIMPIEZA DE FILAS HUERFANAS DE stock
--
-- Los pares (product_id, stock_key) de abajo son los VALIDOS, generados
-- desde el catalogo actual de products.ts. Todo lo que este en la tabla
-- y NO este aca, sobra. Eso cubre solo tres casos:
--   · productos eliminados (incluidos los viejos vap-2...vap-8, que NO
--     son los vap-rec-2...vap-rec-8 de ahora)
--   · productos que CAMBIARON de clave al sumarles un selector
--     (su vieja fila con clave '' queda huerfana)
--   · productos con sinStock, que no deberian tener fila
--
-- Catalogo: 19 productos · 49 pares validos
-- Sin stock (no llevan fila): promo-silicone
--
-- ⚠️ REGENERAR esto cada vez que cambie el catalogo. Si se agrega un
--    producto o se le suma un selector y no se actualiza, este SQL le
--    borraria sus filas buenas.
-- ══════════════════════════════════════════════════════════════

-- ─── 1) MIRAR: que filas sobran ───────────────────────────────
WITH validos (product_id, stock_key) AS (
  VALUES
    ('promo-airpods-pro-2', ''),
    ('promo-airpods-anc', ''),
    ('promo-cable-cabezal', 'C - C'),
    ('promo-cable-cabezal', 'C - Lightning'),
    ('promo-templado-funda', '9D'),
    ('promo-templado-funda', 'Anti espía'),
    ('vap-1', 'Mentol'),
    ('vap-rec-2', ''),
    ('vap-rec-3', ''),
    ('vap-rec-4', ''),
    ('vap-rec-5', ''),
    ('vap-rec-6', ''),
    ('vap-rec-7', ''),
    ('vap-rec-8', ''),
    ('ter-1', ''),
    ('ter-2', ''),
    ('ter-3', ''),
    ('apl-templado', 'iPhone 11'),
    ('apl-templado', 'iPhone 12'),
    ('apl-templado', 'iPhone 13 Pro Max'),
    ('apl-templado', 'iPhone 14 Pro'),
    ('apl-templado', 'iPhone 14 Pro Max'),
    ('apl-templado', 'iPhone 15'),
    ('apl-templado', 'iPhone 15 Pro Max'),
    ('apl-templado', 'iPhone 16'),
    ('apl-templado', 'iPhone 16 Pro'),
    ('apl-templado', 'iPhone 16 Pro Max'),
    ('apl-templado', 'iPhone 17 Pro Max'),
    ('apl-funda-11', 'Negro'),
    ('apl-funda-11', 'Azul marino'),
    ('apl-funda-11', 'Fucsia'),
    ('apl-funda-11', 'Marrón'),
    ('apl-funda-11', 'Naranja'),
    ('apl-funda-11', 'Turquesa'),
    ('apl-funda-11', 'Verde oliva'),
    ('apl-funda-12', 'Negro'),
    ('apl-funda-12', 'Azul marino'),
    ('apl-funda-12', 'Blanco'),
    ('apl-funda-12', 'Borravino'),
    ('apl-funda-12', 'Lila oscuro'),
    ('apl-funda-12', 'Marrón'),
    ('apl-funda-12', 'Morado'),
    ('apl-funda-12', 'Naranja'),
    ('apl-funda-12', 'Rojo desgastado'),
    ('apl-funda-12', 'Rosado'),
    ('apl-funda-12', 'Rosado claro'),
    ('apl-funda-12', 'Verde'),
    ('apl-funda-12', 'Verde agua'),
    ('apl-funda-12', 'Verde militar')
)
SELECT s.product_id, s.stock_key, s.cantidad, s.updated_at
  FROM stock s
 WHERE NOT EXISTS (
   SELECT 1 FROM validos v
    WHERE v.product_id = s.product_id AND v.stock_key = s.stock_key
 )
 ORDER BY s.product_id, s.stock_key;

-- ─── 2) RESUMEN: cuantas son y cuantas unidades tienen ────────
WITH validos (product_id, stock_key) AS (
  VALUES
    ('promo-airpods-pro-2', ''),
    ('promo-airpods-anc', ''),
    ('promo-cable-cabezal', 'C - C'),
    ('promo-cable-cabezal', 'C - Lightning'),
    ('promo-templado-funda', '9D'),
    ('promo-templado-funda', 'Anti espía'),
    ('vap-1', 'Mentol'),
    ('vap-rec-2', ''),
    ('vap-rec-3', ''),
    ('vap-rec-4', ''),
    ('vap-rec-5', ''),
    ('vap-rec-6', ''),
    ('vap-rec-7', ''),
    ('vap-rec-8', ''),
    ('ter-1', ''),
    ('ter-2', ''),
    ('ter-3', ''),
    ('apl-templado', 'iPhone 11'),
    ('apl-templado', 'iPhone 12'),
    ('apl-templado', 'iPhone 13 Pro Max'),
    ('apl-templado', 'iPhone 14 Pro'),
    ('apl-templado', 'iPhone 14 Pro Max'),
    ('apl-templado', 'iPhone 15'),
    ('apl-templado', 'iPhone 15 Pro Max'),
    ('apl-templado', 'iPhone 16'),
    ('apl-templado', 'iPhone 16 Pro'),
    ('apl-templado', 'iPhone 16 Pro Max'),
    ('apl-templado', 'iPhone 17 Pro Max'),
    ('apl-funda-11', 'Negro'),
    ('apl-funda-11', 'Azul marino'),
    ('apl-funda-11', 'Fucsia'),
    ('apl-funda-11', 'Marrón'),
    ('apl-funda-11', 'Naranja'),
    ('apl-funda-11', 'Turquesa'),
    ('apl-funda-11', 'Verde oliva'),
    ('apl-funda-12', 'Negro'),
    ('apl-funda-12', 'Azul marino'),
    ('apl-funda-12', 'Blanco'),
    ('apl-funda-12', 'Borravino'),
    ('apl-funda-12', 'Lila oscuro'),
    ('apl-funda-12', 'Marrón'),
    ('apl-funda-12', 'Morado'),
    ('apl-funda-12', 'Naranja'),
    ('apl-funda-12', 'Rojo desgastado'),
    ('apl-funda-12', 'Rosado'),
    ('apl-funda-12', 'Rosado claro'),
    ('apl-funda-12', 'Verde'),
    ('apl-funda-12', 'Verde agua'),
    ('apl-funda-12', 'Verde militar')
)
SELECT count(*)::int AS filas_a_borrar,
       coalesce(sum(s.cantidad), 0)::int AS unidades_en_esas_filas
  FROM stock s
 WHERE NOT EXISTS (
   SELECT 1 FROM validos v
    WHERE v.product_id = s.product_id AND v.stock_key = s.stock_key
 );

-- ─── 3) BORRAR (recien despues de revisar 1 y 2) ──────────────
WITH validos (product_id, stock_key) AS (
  VALUES
    ('promo-airpods-pro-2', ''),
    ('promo-airpods-anc', ''),
    ('promo-cable-cabezal', 'C - C'),
    ('promo-cable-cabezal', 'C - Lightning'),
    ('promo-templado-funda', '9D'),
    ('promo-templado-funda', 'Anti espía'),
    ('vap-1', 'Mentol'),
    ('vap-rec-2', ''),
    ('vap-rec-3', ''),
    ('vap-rec-4', ''),
    ('vap-rec-5', ''),
    ('vap-rec-6', ''),
    ('vap-rec-7', ''),
    ('vap-rec-8', ''),
    ('ter-1', ''),
    ('ter-2', ''),
    ('ter-3', ''),
    ('apl-templado', 'iPhone 11'),
    ('apl-templado', 'iPhone 12'),
    ('apl-templado', 'iPhone 13 Pro Max'),
    ('apl-templado', 'iPhone 14 Pro'),
    ('apl-templado', 'iPhone 14 Pro Max'),
    ('apl-templado', 'iPhone 15'),
    ('apl-templado', 'iPhone 15 Pro Max'),
    ('apl-templado', 'iPhone 16'),
    ('apl-templado', 'iPhone 16 Pro'),
    ('apl-templado', 'iPhone 16 Pro Max'),
    ('apl-templado', 'iPhone 17 Pro Max'),
    ('apl-funda-11', 'Negro'),
    ('apl-funda-11', 'Azul marino'),
    ('apl-funda-11', 'Fucsia'),
    ('apl-funda-11', 'Marrón'),
    ('apl-funda-11', 'Naranja'),
    ('apl-funda-11', 'Turquesa'),
    ('apl-funda-11', 'Verde oliva'),
    ('apl-funda-12', 'Negro'),
    ('apl-funda-12', 'Azul marino'),
    ('apl-funda-12', 'Blanco'),
    ('apl-funda-12', 'Borravino'),
    ('apl-funda-12', 'Lila oscuro'),
    ('apl-funda-12', 'Marrón'),
    ('apl-funda-12', 'Morado'),
    ('apl-funda-12', 'Naranja'),
    ('apl-funda-12', 'Rojo desgastado'),
    ('apl-funda-12', 'Rosado'),
    ('apl-funda-12', 'Rosado claro'),
    ('apl-funda-12', 'Verde'),
    ('apl-funda-12', 'Verde agua'),
    ('apl-funda-12', 'Verde militar')
)
DELETE FROM stock s
 WHERE NOT EXISTS (
   SELECT 1 FROM validos v
    WHERE v.product_id = s.product_id AND v.stock_key = s.stock_key
 );

-- ─── 4) COMPROBAR: tiene que dar 0 ───────────────────────────
WITH validos (product_id, stock_key) AS (
  VALUES
    ('promo-airpods-pro-2', ''),
    ('promo-airpods-anc', ''),
    ('promo-cable-cabezal', 'C - C'),
    ('promo-cable-cabezal', 'C - Lightning'),
    ('promo-templado-funda', '9D'),
    ('promo-templado-funda', 'Anti espía'),
    ('vap-1', 'Mentol'),
    ('vap-rec-2', ''),
    ('vap-rec-3', ''),
    ('vap-rec-4', ''),
    ('vap-rec-5', ''),
    ('vap-rec-6', ''),
    ('vap-rec-7', ''),
    ('vap-rec-8', ''),
    ('ter-1', ''),
    ('ter-2', ''),
    ('ter-3', ''),
    ('apl-templado', 'iPhone 11'),
    ('apl-templado', 'iPhone 12'),
    ('apl-templado', 'iPhone 13 Pro Max'),
    ('apl-templado', 'iPhone 14 Pro'),
    ('apl-templado', 'iPhone 14 Pro Max'),
    ('apl-templado', 'iPhone 15'),
    ('apl-templado', 'iPhone 15 Pro Max'),
    ('apl-templado', 'iPhone 16'),
    ('apl-templado', 'iPhone 16 Pro'),
    ('apl-templado', 'iPhone 16 Pro Max'),
    ('apl-templado', 'iPhone 17 Pro Max'),
    ('apl-funda-11', 'Negro'),
    ('apl-funda-11', 'Azul marino'),
    ('apl-funda-11', 'Fucsia'),
    ('apl-funda-11', 'Marrón'),
    ('apl-funda-11', 'Naranja'),
    ('apl-funda-11', 'Turquesa'),
    ('apl-funda-11', 'Verde oliva'),
    ('apl-funda-12', 'Negro'),
    ('apl-funda-12', 'Azul marino'),
    ('apl-funda-12', 'Blanco'),
    ('apl-funda-12', 'Borravino'),
    ('apl-funda-12', 'Lila oscuro'),
    ('apl-funda-12', 'Marrón'),
    ('apl-funda-12', 'Morado'),
    ('apl-funda-12', 'Naranja'),
    ('apl-funda-12', 'Rojo desgastado'),
    ('apl-funda-12', 'Rosado'),
    ('apl-funda-12', 'Rosado claro'),
    ('apl-funda-12', 'Verde'),
    ('apl-funda-12', 'Verde agua'),
    ('apl-funda-12', 'Verde militar')
)
SELECT count(*)::int AS deberia_ser_cero
  FROM stock s
 WHERE NOT EXISTS (
   SELECT 1 FROM validos v
    WHERE v.product_id = s.product_id AND v.stock_key = s.stock_key
 );

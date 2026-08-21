/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("users", {
      id: {
        type: "serial",
        primaryKey: true,
      },
      name: {
        type: "varchar(255)",
        notNull: true,
      },
      email: {
        type: "varchar(255)",
        notNull: true,
        unique: true,
      },
      password: {
        type: "varchar(255)",
        notNull: true,
      },
      createdAt: {
        type: "timestamp",
        notNull: true,
        default: pgm.func("CURRENT_TIMESTAMP"),
      },
      updatedAt: {
        type: "timestamp",
        notNull: true,
        default: pgm.func("CURRENT_TIMESTAMP"),
      },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("users");
};

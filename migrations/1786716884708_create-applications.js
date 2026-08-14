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
  pgm.createTable('applications', {
      id: {
        type: 'serial',
        primaryKey: true,
      },
  
      jobId: {
        type: 'integer',
        notNull: true,
        unique: true,
        references: 'jobs(id)',
        onDelete: 'CASCADE',
      },
  
      status: {
        type: 'varchar(50)',
        notNull: true,
        default: 'applied',
      },
  
      appliedAt: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
  
      notes: {
        type: 'text',
        notNull: false,
      },
  
      createdAt: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
  
      updatedAt: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('CURRENT_TIMESTAMP'),
      },
    });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable('applications');
};

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('matches', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Date et heure du match'
      },
      opponent: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Nom de l\'équipe adverse'
      },
      location: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Lieu du match'
      },
      is_home: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: 'Match à domicile ou à l\'extérieur'
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled',
        comment: 'Statut du match'
      },
      score_team: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Score de notre équipe'
      },
      score_opponent: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Score de l\'équipe adverse'
      },
      presence_open: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Les joueurs peuvent-ils confirmer leur présence'
      },
      man_of_match_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Joueur du match'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index pour optimiser les requêtes
    await queryInterface.addIndex('matches', ['date']);
    await queryInterface.addIndex('matches', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('matches');
  }
};
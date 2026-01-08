const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Match = sequelize.define('Match', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'La date doit être valide'
        },
        isFuture(value) {
          if (new Date(value) < new Date()) {
            throw new Error('La date du match doit être dans le futur');
          }
        }
      }
    },
    opponent: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: {
          args: [2, 100],
          msg: 'Le nom de l\'adversaire doit contenir entre 2 et 100 caractères'
        },
        notEmpty: {
          msg: 'Le nom de l\'adversaire est obligatoire'
        }
      }
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: {
          args: [2, 200],
          msg: 'Le lieu doit contenir entre 2 et 200 caractères'
        },
        notEmpty: {
          msg: 'Le lieu est obligatoire'
        }
      }
    },
    isHome: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_home'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
      defaultValue: 'scheduled',
      validate: {
        isIn: {
          args: [['scheduled', 'completed', 'cancelled']],
          msg: 'Le statut doit être scheduled, completed ou cancelled'
        }
      }
    },
    scoreTeam: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'score_team',
      validate: {
        min: {
          args: 0,
          msg: 'Le score ne peut pas être négatif'
        }
      }
    },
    scoreOpponent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'score_opponent',
      validate: {
        min: {
          args: 0,
          msg: 'Le score ne peut pas être négatif'
        }
      }
    },
    presenceOpen: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'presence_open'
    },
    manOfMatchId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'man_of_match_id'
    }
  }, {
    tableName: 'matches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeUpdate: (match) => {
        // Empêcher la modification de la date si le match est déjà terminé
        if (match.status === 'completed' && match.changed('date')) {
          throw new Error('Impossible de modifier la date d\'un match terminé');
        }
      }
    }
  });

  // Associations
  Match.associate = (models) => {
    // Un match peut avoir un homme du match
    Match.belongsTo(models.User, {
      foreignKey: 'manOfMatchId',
      as: 'manOfMatch'
    });

    // Un match peut avoir plusieurs présences (à développer plus tard)
    // Match.hasMany(models.Presence, {
    //   foreignKey: 'matchId',
    //   as: 'presences'
    // });
  };

  return Match;
};
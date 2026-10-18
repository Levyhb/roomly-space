import { DataTypes, Model, Sequelize } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
  NonAttribute,
} from "sequelize";

export type UserRole = "USER" | "ADMIN";

function databaseStorage(): string {
  if (process.env.NODE_ENV === "test") {
    return process.env.DB_STORAGE_TEST || "./test.sqlite";
  }

  if (process.env.NODE_ENV === "production") {
    return process.env.DB_STORAGE_PRODUCTION || "./production.sqlite";
  }

  return process.env.DB_STORAGE_DEVELOPMENT || "./development.sqlite";
}

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: databaseStorage(),
  logging: false,
});

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare email: string;
  declare role: UserRole;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: { isIn: [["USER", "ADMIN"]] },
    },
  },
  { sequelize, tableName: "users", timestamps: false },
);

export class Room extends Model<
  InferAttributes<Room>,
  InferCreationAttributes<Room>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare capacity: number;
  declare address: string;
  declare description: string;
  declare imageUrl: CreationOptional<string | null>;
  declare resources?: NonAttribute<Resource[]>;
}

Room.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    address: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    imageUrl: { type: DataTypes.TEXT, allowNull: true, field: "image_url" },
  },
  { sequelize, tableName: "rooms", timestamps: false },
);

export class Resource extends Model<
  InferAttributes<Resource>,
  InferCreationAttributes<Resource>
> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare name: string;
}

Resource.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
  },
  { sequelize, tableName: "resources", timestamps: false },
);

export class RoomResource extends Model<
  InferAttributes<RoomResource>,
  InferCreationAttributes<RoomResource>
> {
  declare roomId: number;
  declare resourceId: number;
}

RoomResource.init(
  {
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "room_id",
      references: { model: Room, key: "id" },
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "resource_id",
      references: { model: Resource, key: "id" },
    },
  },
  { sequelize, tableName: "room_resources", timestamps: false },
);

Room.belongsToMany(Resource, {
  through: RoomResource,
  as: "resources",
  foreignKey: "roomId",
  otherKey: "resourceId",
});

export class Reservation extends Model<
  InferAttributes<Reservation>,
  InferCreationAttributes<Reservation>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare roomId: number;
  declare startsAt: Date;
  declare endsAt: Date;
}

Reservation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      references: { model: User, key: "id" },
    },
    roomId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "room_id",
      references: { model: Room, key: "id" },
    },
    startsAt: { type: DataTypes.DATE, allowNull: false, field: "starts_at" },
    endsAt: { type: DataTypes.DATE, allowNull: false, field: "ends_at" },
  },
  { sequelize, tableName: "reservations", timestamps: false },
);

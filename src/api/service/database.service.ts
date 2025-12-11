import { Database } from "bun:sqlite";
import process from "node:process";
import { singleton } from "tsyringe";
import { ModelDDL, Model } from "@/api/schema/model.database.ts";

@singleton()
export default class DatabaseService {
    private db?: Database;

    getModel(id: string): Model | null {
        const row = this.sqlite().query("SELECT * FROM models WHERE id = $id").get({ $id: id });
        if (row) {
            return Model.parse(row);
        }
        return null;
    }

    getAllModels(): Model[] {
        const rows = this.sqlite().query("SELECT * FROM models").all();
        return rows.map((row) => Model.parse(row));
    }

    setModel(model: Model): void {
        this.sqlite().run(
            `INSERT OR REPLACE INTO models ("id", "name", "description", "imageUrl", "promptPrice", "completionPrice", "createdAt") 
             VALUES ($id, $name, $description, $imageUrl, $promptPrice, $completionPrice, $createdAt)`,
            {
                // @ts-expect-error
                $id: model.id,
                $name: model.name,
                $description: model.description,
                $imageUrl: model.imageUrl,
                $promptPrice: model.promptPrice,
                $completionPrice: model.completionPrice,
                $createdAt: model.createdAt?.toISOString(),
            },
        );
    }

    getValue(key: string): string | null {
        const row = this.sqlite().query("SELECT v FROM kv WHERE k = $key").get({ $key: key }) as {
            v: string | null;
        } | null;
        return row?.v ?? null;
    }

    setValue(key: string, value: string): void {
        // @ts-expect-error
        this.sqlite().run("INSERT OR REPLACE INTO kv (k, v) VALUES ($key, $value)", { $key: key, $value: value });
    }

    getOrSetValue(key: string, defaultValue: string): string {
        const value = this.getValue(key);
        if (value !== null) {
            return value;
        }
        this.setValue(key, defaultValue);
        return defaultValue;
    }

    getOrComputeValue(key: string, computeFn: () => string): string {
        const value = this.getValue(key);
        if (value !== null) {
            return value;
        }
        const computedValue = computeFn();
        this.setValue(key, computedValue);
        return computedValue;
    }

    private sqlite(): Database {
        let db = this.db;
        if (db) {
            return db;
        }
        db = new Database(process.env.DB_PATH || "llmanager.sqlite", { create: true });
        db.query(DatabaseService.KvDDL).run();
        db.query(ModelDDL).run();
        this.db = db;
        return db;
    }

    private static KvDDL = `
        CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
    `;
}

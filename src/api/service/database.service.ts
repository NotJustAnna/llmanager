import { Database } from "bun:sqlite";
import process from "node:process";
import { singleton } from "tsyringe";

@singleton()
export default class DatabaseService {
    private db?: Database;

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
        db.query(DatabaseService.DDL).run();
        this.db = db;
        return db;
    }

    private static DDL = `
        CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
    `;
}

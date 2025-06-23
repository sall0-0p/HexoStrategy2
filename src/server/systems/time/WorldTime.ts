import {RunService} from "@rbxts/services";
import {Signal} from "../../../shared/classes/Signal";

const GAME_START_DATE = "5500-01-01T00:00:00.000Z";
const EPOCH = DateTime.fromIsoDate(GAME_START_DATE)!;
if (!EPOCH) error("This date is impossible!");

export enum GameSpeed {
    VerySlow = 0.5,
    Slow = 0.75,
    Normal = 1,
    Fast = 1.5,
    VeryFast = 2.25,
}

export enum TimeSignalType {
    Tick = "tick",
    Hour = "hour",
    Day = "day",
    Month = "month",
    Year = "year",
}

interface Alarm {
    timestamp: number;
    signal: Signal<[]>;
}

export class WorldTime {
    private ticksSinceGameStart = 0;
    private gameSpeed = GameSpeed.Normal;
    private onPause = true;

    private tickEvent = new Signal<[number, TimeValueTable]>();
    private hourEvent = new Signal<[number, TimeValueTable]>();
    private dayEvent = new Signal<[number, TimeValueTable]>();
    private monthEvent = new Signal<[number, TimeValueTable]>();
    private yearEvent = new Signal<[number, TimeValueTable]>();

    private time: TimeValueTable = DateTime.fromUnixTimestamp(0).ToUniversalTime();
    private timestamp: number = 0;
    private alarmQueue: Alarm[] = [];

    private static instance: WorldTime;
    private constructor() {
        RunService.Heartbeat.Connect((dt) => this.onTick(dt));
    }

    private onTick(dt: number) {
        if (this.onPause) return;
        this.ticksSinceGameStart += dt * 180 * this.gameSpeed;
        const timestamp = EPOCH.UnixTimestamp + this.ticksSinceGameStart * 60;
        const time = DateTime.fromUnixTimestamp(timestamp).ToUniversalTime();

        this.tickEvent.fire(timestamp, time);

        if (time.Hour !== this.time.Hour) {
            this.hourEvent.fire(timestamp, time);
        }

        if (time.Day !== this.time.Day) {
            this.dayEvent.fire(timestamp, time);
        }

        if (time.Month !== this.time.Month) {
            this.monthEvent.fire(timestamp, time);
        }

        if (time.Year !== this.time.Year) {
            this.yearEvent.fire(timestamp, time);
        }

        this.time = time;
        this.timestamp = timestamp;
        this.checkAlarms(timestamp);
    }

    private checkAlarms(timestamp: number) {
        if (this.alarmQueue[0] && this.alarmQueue[0].timestamp <= timestamp) {
            const alarm = this.alarmQueue[0];
            this.alarmQueue.remove(0);
            alarm?.signal.fire();
            this.checkAlarms(timestamp);
        }
    }

    public on(signalType: TimeSignalType) {
        switch (signalType) {
            case "tick":
                return this.tickEvent;
            case "hour":
                return this.hourEvent;
            case "day":
                return this.dayEvent;
            case "month":
                return this.monthEvent;
            case "year":
                return this.yearEvent;
        }

        error(`${signalType} is invalid!`);
    }

    public setAlarm(timestamp: number) {
        timestamp = math.floor(timestamp / 60) * 60;
        print("Setting alarm to", DateTime.fromUnixTimestamp(timestamp).ToUniversalTime());

        const alarm = {
            timestamp: timestamp,
            signal: new Signal(),
        } as Alarm;

        this.alarmQueue.push(alarm);
        this.alarmQueue = this.alarmQueue.sort((a, b) => {
            return a.timestamp > b.timestamp;
        })

        return alarm.signal;
    }

    public setDelay(hours: number) {
        return this.setAlarm(this.getTimestamp() + 60 * hours).connect(() => print("Alarm!"));
    }

    public getTimestamp() {
        return this.timestamp;
    }

    public getTime() {
        return this.time;
    }

    public isPaused() {
        return this.onPause;
    }

    public setPaused(value: boolean) {
        this.onPause = value;
    }

    public getGameSpeed() {
        return this.gameSpeed;
    }

    public setGameSpeed(value: GameSpeed) {
        this.gameSpeed = value;
    }

    // singleton shenanigans
    public static getInstance() {
        if (!this.instance) {
            this.instance = new WorldTime();
        }

        return this.instance;
    }
}
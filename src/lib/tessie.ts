import streamDeck from "@elgato/streamdeck";
import axios, { type AxiosInstance } from "axios";

const DEFAULT_MAP_PARAMS: GetMapParams = {
  width: 288,
  height: 288,
  zoom: 15,
  marker_size: 75,
  style: "dark",
};

const DEFAULT_TIRE_PRESSURE_PARAMS: GetTirePressureParams = {
  pressure_format: "bar",
};

export class Tessie {
  #vin?: string;
  #api: AxiosInstance;

  constructor(token: string, vin?: string) {
    this.#vin = vin;
    this.#api = axios.create({
      baseURL: "https://api.tessie.com/",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "tessie-sdk/1.0 (StreamDeck)",
      },
    });
  }

  setVin(vin: string) {
    this.#vin = vin;
    return this;
  }

  clearVin() {
    this.#vin = undefined;
    return this;
  }

  #vinPath(segment: string) {
    if (!this.#vin) throw new MissingVinError();
    return `/${this.#vin}/${segment}`;
  }

  async #request<T>(fn: () => Promise<{ data: T }>): Promise<T | null> {
    try {
      const { data } = await fn();
      return data;
    } catch (error: any) {
      if (error?.response?.status) {
        streamDeck.logger.error(
          `Tessie ${error.response.status}: ${error.response.data ?? error.message}`,
        );
      } else {
        streamDeck.logger.error(
          `Tessie error: ${error?.message ?? String(error)}`,
        );
      }
      return null;
    }
  }

  async getVehicles() {
    return this.#request<GetVehiclesResponse>(() => {
      return this.#api.get("vehicles");
    });
  }

  async getBattery() {
    return this.#request<GetBatteryResponse>(() => {
      return this.#api.get(this.#vinPath("battery"));
    });
  }

  async getBatteryHealthMeasurements() {
    return this.#request<GetBatteryHealthMeasurementsResponse>(() => {
      return this.#api.get(this.#vinPath("battery_health"));
    });
  }

  async getLocation() {
    return this.#request<GetLocationResponse>(() => {
      return this.#api.get(this.#vinPath("location"));
    });
  }

  async getTirePressure(params?: Partial<GetTirePressureParams>) {
    return this.#request<GetTirePressureResponse>(() => {
      return this.#api.get(this.#vinPath("tire_pressure"), {
        params: { ...DEFAULT_TIRE_PRESSURE_PARAMS, ...params },
      });
    });
  }

  async wake() {
    return this.#request<WakeResponse>(() => {
      return this.#api.post(this.#vinPath("wake"));
    });
  }

  async startClimate() {
    return this.#request<StartClimateResponse>(() => {
      return this.#api.post(this.#vinPath("command/start_climate"));
    });
  }

  async stopClimate() {
    return this.#request<StopClimateResponse>(() => {
      return this.#api.post(this.#vinPath("command/stop_climate"));
    });
  }

  async getMapRaw(params?: Partial<GetMapParams>): Promise<ArrayBuffer | null> {
    try {
      const response = await this.#api.get<GetMapResponse>(
        this.#vinPath("map"),
        {
          params: { ...DEFAULT_MAP_PARAMS, ...params },
          responseType: "arraybuffer",
        },
      );
      return response.data;
    } catch (error) {
      streamDeck.logger.error(error);
      return null;
    }
  }

  async getMap(params?: Partial<GetMapParams>): Promise<string | null> {
    const bytes = await this.getMapRaw(params);
    if (!bytes) return null;

    let contentType = "image/png";
    try {
      const response = await this.#api.head(this.#vinPath("map"), {
        params: { ...DEFAULT_MAP_PARAMS, ...params },
      });
      contentType = String(response.headers["Content-Type"]) || contentType;
    } catch {}

    const base64 = Buffer.from(bytes).toString("base64");
    return `data:${contentType};base64,${base64}`;
  }
}

class MissingVinError extends Error {
  override name = "MissingVinError";
}

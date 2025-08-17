import streamDeck, {
  type JsonValue,
  type KeyDownEvent,
  type SendToPluginEvent,
  SingletonAction,
  type WillAppearEvent,
  action,
} from "@elgato/streamdeck";

import type { GlobalSettings } from "@/lib/settings";
import { createRingSVG, isPropertyInspectorEvent } from "@/lib/stream-deck";
import { Tessie } from "@/lib/tessie";

type InstanceSettings = {
  vin?: string;
};

type UpdateKeyEvent =
  | WillAppearEvent<InstanceSettings>
  | KeyDownEvent<InstanceSettings>;

@action({ UUID: "dev.infernal.tessie.battery-health-measurements" })
export class BatteryHealthMeasurementsAction extends SingletonAction {
  #tessie?: Tessie;

  override async onWillAppear(
    ev: WillAppearEvent<InstanceSettings>,
  ): Promise<void> {
    this.#updateKey(ev);
  }

  override async onKeyDown(ev: KeyDownEvent<InstanceSettings>): Promise<void> {
    this.#updateKey(ev);
  }

  override async onSendToPlugin(
    ev: SendToPluginEvent<JsonValue, GlobalSettings>,
  ): Promise<void> {
    if (!isPropertyInspectorEvent(ev.payload)) return;
    if (ev.payload.event !== "getVehicles") return;

    const items = await this.#getVehicles();
    streamDeck.ui.current?.sendToPropertyInspector({
      event: "getVehicles",
      items,
    } satisfies DataSourcePayload);
  }

  async #getVehicles(): Promise<DataSourceResult> {
    const settings =
      await streamDeck.settings.getGlobalSettings<GlobalSettings>();
    const { tessieAccessToken } = settings;

    if (!tessieAccessToken) return [];

    const client = this.#tessie ?? new Tessie(tessieAccessToken);
    const data = await client.getVehicles();

    if (!data) return [];

    return data.results.map((vehicle) => ({
      label: `${vehicle.last_state.display_name} (${vehicle.vin})`,
      value: vehicle.vin,
    }));
  }

  async #updateKey(ev: UpdateKeyEvent) {
    const settings =
      await streamDeck.settings.getGlobalSettings<GlobalSettings>();
    const { tessieAccessToken } = settings;
    const { vin } = ev.payload.settings;

    if (!tessieAccessToken || !vin) {
      ev.action.showAlert();
      return;
    }

    if (!this.#tessie) {
      this.#tessie = new Tessie(tessieAccessToken, vin);
      this.#tessie.setVin(vin);
    }

    const data = await this.#tessie.getBatteryHealthMeasurements();

    if (!data) {
      ev.action.showAlert();
      ev.action.setTitle("Unknown");
      return;
    }

    ev.action.setTitle(`${Math.round(data.result.capacity).toString()}%`);

    const svg = createRingSVG(data.result.capacity);

    ev.action.setImage(`data:image/svg+xml,${encodeURIComponent(svg)}`);
  }
}

import streamDeck, {
  type DidReceiveSettingsEvent,
  type JsonValue,
  type KeyDownEvent,
  type SendToPluginEvent,
  SingletonAction,
  type WillAppearEvent,
  action,
} from "@elgato/streamdeck";

import type { GlobalSettings } from "@/lib/settings";
import { isPropertyInspectorEvent } from "@/lib/stream-deck";
import { Tessie } from "@/lib/tessie";

type InstanceSettings = {
  vin?: string;
  pressureFormat?: PressureFormat;
};

type UpdateKeyEvent =
  | WillAppearEvent<InstanceSettings>
  | KeyDownEvent<InstanceSettings>
  | DidReceiveSettingsEvent<InstanceSettings>;

@action({ UUID: "dev.infernal.tessie.tire-pressure" })
export class TirePressureAction extends SingletonAction {
  #tessie?: Tessie;

  override async onWillAppear(event: WillAppearEvent<InstanceSettings>) {
    this.#updateKey(event);
  }

  override async onKeyDown(event: KeyDownEvent<InstanceSettings>) {
    this.#updateKey(event);
  }

  override async onDidReceiveSettings(
    event: DidReceiveSettingsEvent<InstanceSettings>,
  ) {
    this.#updateKey(event);
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

  async #updateKey(ev: UpdateKeyEvent): Promise<void> {
    const settings =
      await streamDeck.settings.getGlobalSettings<GlobalSettings>();
    const { tessieAccessToken } = settings;
    const { vin, pressureFormat } = ev.payload.settings;

    if (!tessieAccessToken || !vin || !pressureFormat) {
      ev.action.showAlert();
      return;
    }

    if (!this.#tessie) {
      this.#tessie = new Tessie(tessieAccessToken, vin);
      this.#tessie.setVin(vin);
    }

    const data = await this.#tessie.getTirePressure({
      pressure_format: pressureFormat,
    });

    if (!data) {
      ev.action.showAlert();
      ev.action.setTitle("Unknown");
      return;
    }

    ev.action.setTitle(
      [
        `FL: ${data.front_left.toFixed(2)}`,
        `FR: ${data.front_right.toFixed(2)}`,
        `RL: ${data.rear_left.toFixed(2)}`,
        `RR: ${data.rear_right.toFixed(2)}`,
        pressureFormat,
      ].join("\n"),
    );
  }
}

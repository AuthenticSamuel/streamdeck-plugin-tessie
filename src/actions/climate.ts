import streamDeck, {
  type JsonValue,
  KeyDownEvent,
  type SendToPluginEvent,
  SingletonAction,
  action,
} from "@elgato/streamdeck";

import type { GlobalSettings } from "@/lib/settings";
import { isPropertyInspectorEvent } from "@/lib/stream-deck";
import { Tessie } from "@/lib/tessie";

type InstanceSettings = {
  vin?: string;
};

@action({ UUID: "dev.infernal.tessie.climate" })
export class ClimateAction extends SingletonAction {
  #tessie?: Tessie;

  override async onKeyDown(ev: KeyDownEvent<InstanceSettings>): Promise<void> {
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
    }

    let data;
    if (ev.payload.state === 0) data = await this.#tessie.startClimate();
    else data = await this.#tessie.stopClimate();

    if (!data) {
      await ev.action.showAlert();
      await ev.action.setTitle("Unknown");
      return;
    }

    if (data.result) {
      await ev.action.showOk();
      await ev.action.setState(ev.payload.state === 0 ? 1 : 0);
    } else {
      await ev.action.showAlert();
    }
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
}

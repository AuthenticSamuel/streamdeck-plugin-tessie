import streamDeck, { LogLevel } from "@elgato/streamdeck";

import {
  BatteryAction,
  BatteryHealthMeasurementsAction,
  ClimateAction,
  LocationAction,
  TirePressureAction,
} from "@/actions";

streamDeck.logger.setLevel(LogLevel.INFO);

// Vehicle Data
streamDeck.actions.registerAction(new BatteryAction());
streamDeck.actions.registerAction(new BatteryHealthMeasurementsAction());
streamDeck.actions.registerAction(new LocationAction());
streamDeck.actions.registerAction(new TirePressureAction());

// Vehicle Commands
streamDeck.actions.registerAction(new ClimateAction());

streamDeck.connect();

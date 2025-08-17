type GetVehiclesResponse = {
  results: {
    vin: string;
    is_active: string;
    last_state: {
      display_name: string;
    };
  }[];
};

type GetBatteryResponse = {
  timestamp: number;
  battery_level: number;
  battery_range: number;
  ideal_battery_range: number;
  phantom_drain_percent: number;
  energy_remaining: number;
  lifetime_energy_used: number;
  pack_current: number;
  pack_voltage: number;
  module_temp_min: number;
  module_temp_max: number;
};

type GetBatteryHealthMeasurementsResponse = {
  result: {
    max_range: number;
    max_ideal_range: number;
    capacity: number;
  };
};

type GetLocationResponse = {
  latitude: number;
  longitude: number;
  address: string;
  saved_location: string;
};

type GetMapParams = {
  width: number;
  height: number;
  zoom: number;
  marker_size: number;
  style: "light" | "dark";
};

type GetMapResponse = ArrayBuffer;

type PressureFormat = "bar" | "kpa" | "psi";

type GetTirePressureParams = {
  pressure_format: PressureFormat;
  from?: number;
  to?: number;
};

type TirePressureStatus = "unknown" | "low" | "normal";

type GetTirePressureResponse = {
  front_left: number;
  front_right: number;
  rear_left: number;
  rear_right: number;
  front_left_status: TirePressureStatus;
  front_right_status: TirePressureStatus;
  rear_left_status: TirePressureStatus;
  rear_right_status: TirePressureStatus;
  timestamp: number;
};

type WakeResponse = {
  result: boolean;
};

type StartClimateResponse = {
  result: boolean;
};

type StopClimateResponse = {
  result: boolean;
};

var longitudeGtc = (function (exports, msfssdk, wtg3000gtc, garminsdk, wtg3000common) {
    'use strict';

    /**
     * Utility class defining virtual file system paths for the Citation Longitude.
     */
    class LongitudeFilePaths {
    }
    /** The virtual file system path to the plugins directory. */
    LongitudeFilePaths.PLUGINS_PATH = 'coui://SimObjects/Airplanes/Asobo_Longitude/panel/Instruments/G3000/Plugins';
    /** The virtual file system path to the assets directory. */
    LongitudeFilePaths.ASSETS_PATH = 'coui://SimObjects/Airplanes/Asobo_Longitude/panel/Instruments/G3000/Plugins/Assets';

    /**
     * A plugin which loads the Longitude PFD CSS file.
     */
    class LongitudeGtcCssPlugin extends wtg3000gtc.AbstractG3000GtcPlugin {
        /** @inheritdoc */
        onInstalled() {
            this.loadCss(`${LongitudeFilePaths.PLUGINS_PATH}/LongitudeGtcPlugins.css`);
        }
    }
    msfssdk.registerPlugin(LongitudeGtcCssPlugin);

    var LongitudeGtcKeys;
    (function (LongitudeGtcKeys) {
        LongitudeGtcKeys["CabinManagement"] = "CabinManagement";
        LongitudeGtcKeys["Temp"] = "Temp";
        LongitudeGtcKeys["CabinPressure"] = "CabinPressure";
        LongitudeGtcKeys["ExteriorLights"] = "ExteriorLights";
        LongitudeGtcKeys["Propulsion"] = "Propulsion";
        LongitudeGtcKeys["StallSchedule"] = "StallSchedule";
        LongitudeGtcKeys["SystemTests"] = "SystemTests";
        LongitudeGtcKeys["AlertSuppression"] = "AlertSupression";
        LongitudeGtcKeys["Maintenance"] = "Maintenance";
        LongitudeGtcKeys["LandingElevationDialog"] = "LandingElevationDialog";
    })(LongitudeGtcKeys || (LongitudeGtcKeys = {}));

    var BeaconLightsMode;
    (function (BeaconLightsMode) {
        BeaconLightsMode["Normal"] = "Normal";
        BeaconLightsMode["On"] = "On";
        BeaconLightsMode["Off"] = "Off";
    })(BeaconLightsMode || (BeaconLightsMode = {}));
    var RecircFanSpeed;
    (function (RecircFanSpeed) {
        RecircFanSpeed["Low"] = "LOW";
        RecircFanSpeed["High"] = "HI";
        RecircFanSpeed["Off"] = "OFF";
    })(RecircFanSpeed || (RecircFanSpeed = {}));
    var EcsTemperatureUnits;
    (function (EcsTemperatureUnits) {
        EcsTemperatureUnits["Celsius"] = "Celsius";
        EcsTemperatureUnits["Fahrenheit"] = "Fahrenheit";
    })(EcsTemperatureUnits || (EcsTemperatureUnits = {}));
    var CabinAltitudeMode;
    (function (CabinAltitudeMode) {
        CabinAltitudeMode["FMS"] = "FMS";
        CabinAltitudeMode["LandingAlt"] = "LandingAlt";
        CabinAltitudeMode["CabinAlt"] = "CabinAlt";
    })(CabinAltitudeMode || (CabinAltitudeMode = {}));
    /** Utility class for retreiving a Longitude user setting manager. */
    class LongitudeUserSettings {
        /**
         * Retrieves a manager for the Longitude user settings.
         * @param bus The event bus
         * @returns A manager for LongitudeUserSettingTypes.
         */
        static getManager(bus) {
            var _a;
            return (_a = LongitudeUserSettings.INSTANCE) !== null && _a !== void 0 ? _a : (LongitudeUserSettings.INSTANCE = new msfssdk.DefaultUserSettingManager(bus, [
                {
                    name: 'recircFanSpeed',
                    defaultValue: RecircFanSpeed.Low
                },
                {
                    name: 'cockpitSetTemperature',
                    defaultValue: 0
                },
                {
                    name: 'cabinSetTemperature',
                    defaultValue: 0
                },
                {
                    name: 'temperatureControlUnits',
                    defaultValue: EcsTemperatureUnits.Celsius
                },
                {
                    name: 'ittEngineDigits',
                    defaultValue: false
                },
                {
                    name: 'apuUsageTime',
                    defaultValue: 0
                },
                {
                    name: 'apuUsageCycles',
                    defaultValue: 0
                },
                {
                    name: 'engineIgnitorsSetOn',
                    defaultValue: false
                },
                {
                    name: 'lightsNavigationOn',
                    defaultValue: true
                },
                {
                    name: 'lightsBeaconMode',
                    defaultValue: BeaconLightsMode.Normal
                },
                {
                    name: 'lightsPulseTaRaOn',
                    defaultValue: true
                },
                {
                    name: 'cabinAltitudeMode',
                    defaultValue: CabinAltitudeMode.FMS
                },
                {
                    name: 'cabinSelectedAltitude',
                    defaultValue: -9999
                },
                {
                    name: 'cabinLandingAltitude',
                    defaultValue: -9999
                }
            ]));
        }
    }

    /**
     * The Longitude exterior lighting controls page.
     */
    class LongitudeExteriorLightsPage extends wtg3000gtc.GtcView {
        constructor() {
            super(...arguments);
            this.settings = LongitudeUserSettings.getManager(this.bus);
            this.navSetting = this.settings.getSetting('lightsNavigationOn');
            this.beaconSetting = this.settings.getSetting('lightsBeaconMode');
            this.pulseSetting = this.settings.getSetting('lightsPulseTaRaOn');
            this.navOffState = this.navSetting.map(o => !o);
            this.beaconNormState = this.beaconSetting.map(m => m === BeaconLightsMode.Normal);
            this.beaconOnState = this.beaconSetting.map(m => m === BeaconLightsMode.On);
            this.beaconOffState = this.beaconSetting.map(m => m === BeaconLightsMode.Off);
            this.pulseOffState = this.pulseSetting.map(o => !o);
        }
        /** @inheritdoc */
        onAfterRender(thisNode) {
            this.thisNode = thisNode;
            this._title.set('Exterior Lights');
        }
        /** @inheritdoc */
        render() {
            return (msfssdk.FSComponent.buildComponent("div", { class: 'lng-lights-page' },
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-light-page-row' },
                    msfssdk.FSComponent.buildComponent("label", null, "Navigation"),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'On', state: this.navSetting, onPressed: () => this.navSetting.set(true) }),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'Off', state: this.navOffState, onPressed: () => this.navSetting.set(false) })),
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-light-page-row three-button' },
                    msfssdk.FSComponent.buildComponent("label", null, "Beacon"),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'Normal', state: this.beaconNormState, onPressed: () => this.beaconSetting.set(BeaconLightsMode.Normal) }),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'On', state: this.beaconOnState, onPressed: () => this.beaconSetting.set(BeaconLightsMode.On) }),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'Off', state: this.beaconOffState, onPressed: () => this.beaconSetting.set(BeaconLightsMode.Off) })),
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-light-page-row' },
                    msfssdk.FSComponent.buildComponent("label", null, "Pulse With TCAS TA/RA"),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'On', state: this.pulseSetting, onPressed: () => this.pulseSetting.set(true) }),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'Off', state: this.pulseOffState, onPressed: () => this.pulseSetting.set(false) }))));
        }
        /** @inheritdoc */
        destroy() {
            this.thisNode && msfssdk.FSComponent.shallowDestroy(this.thisNode);
            this.navOffState.destroy();
            this.beaconNormState.destroy();
            this.beaconOnState.destroy();
            this.beaconOffState.destroy();
            this.pulseOffState.destroy();
            super.destroy();
        }
    }

    /**
     * The Longitude pressurization page.
     */
    class LongitudePressurizationPage extends wtg3000gtc.GtcView {
        constructor() {
            super(...arguments);
            this.normalButton = msfssdk.FSComponent.createRef();
            this.altitudeSelectButton = msfssdk.FSComponent.createRef();
            this.altitudeButton = msfssdk.FSComponent.createRef();
            this.normalMode = CabinAltitudeMode.FMS;
            this.altitudeUnitsSetting = garminsdk.UnitsUserSettings.getManager(this.props.bus).getSetting('unitsAltitude');
            this.cabinAltitudeModeSetting = LongitudeUserSettings.getManager(this.props.bus).getSetting('cabinAltitudeMode');
            this.cabinLandingAltSetting = LongitudeUserSettings.getManager(this.props.bus).getSetting('cabinLandingAltitude');
            this.cabinSelectedAltSetting = LongitudeUserSettings.getManager(this.props.bus).getSetting('cabinSelectedAltitude');
            this.normalState = this.cabinAltitudeModeSetting.map(m => m === CabinAltitudeMode.FMS || m === CabinAltitudeMode.LandingAlt);
            this.altitudeSelectState = this.cabinAltitudeModeSetting.map(m => m === CabinAltitudeMode.CabinAlt);
            this.altitudeSectionLabel = this.cabinAltitudeModeSetting.map(m => m === CabinAltitudeMode.CabinAlt ? 'Cabin Altitude' : 'Landing Elevation');
            this.selectedLandingAltitude = msfssdk.NumberUnitSubject.create(msfssdk.UnitType.FOOT.createNumber(NaN));
            this.fmsLandingAltitude = msfssdk.NumberUnitSubject.create(msfssdk.UnitType.FOOT.createNumber(NaN));
            this.selectedCabinAltitude = msfssdk.NumberUnitSubject.create(msfssdk.UnitType.FOOT.createNumber(NaN));
            this.facility = msfssdk.Subject.create(undefined);
            this.displayedAltitude = msfssdk.NumberUnitSubject.create(msfssdk.UnitType.FOOT.createNumber(NaN));
            this.displayedAltitudeClass = this.cabinAltitudeModeSetting.map(m => m === CabinAltitudeMode.FMS ? 'lng-press-alt-button-label-value' : 'lng-press-alt-button-label-value user-sel');
            this.displayedIcao = this.facility.map(fac => fac !== undefined ? msfssdk.ICAO.getIdent(fac.icao) : '____');
            this.displayedIcaoClass = this.cabinAltitudeModeSetting.map(m => m === CabinAltitudeMode.FMS ? 'lng-press-alt-button-label-icao' : 'lng-press-alt-button-label-icao hidden');
            this.displayedName = this.facility.map(fac => fac !== undefined ? Utils.Translate(fac.name) : '');
            this.displayedNameClass = this.cabinAltitudeModeSetting.map(m => m === CabinAltitudeMode.FMS ? 'lng-press-alt-button-label-name' : 'lng-press-alt-button-label-name hidden');
            this.destinationDetails = msfssdk.MappedSubject.create(this.props.flightPlanStore.destinationFacility, this.props.flightPlanStore.destinationRunway);
        }
        /** @inheritdoc */
        onAfterRender() {
            this._title.set('Cabin Pressure');
            this.destinationSub = this.destinationDetails.sub(this.onDestinationDetailsChanged.bind(this), false, true);
            this.modeSub = this.cabinAltitudeModeSetting.sub(this.onCabinAltitudeModeChanged.bind(this), false, true);
            this.landingAltSub = this.cabinLandingAltSetting.sub(this.onLandingAltitudeChanged.bind(this), false, true);
            this.cabinSelectedAltSub = this.cabinSelectedAltSetting.sub(this.onCabinAltitudeChanged.bind(this), false, true);
        }
        /** @inheritdoc */
        onResume() {
            var _a, _b, _c, _d;
            (_a = this.destinationSub) === null || _a === void 0 ? void 0 : _a.resume(true);
            (_b = this.modeSub) === null || _b === void 0 ? void 0 : _b.resume(true);
            (_c = this.landingAltSub) === null || _c === void 0 ? void 0 : _c.resume(true);
            (_d = this.cabinSelectedAltSub) === null || _d === void 0 ? void 0 : _d.resume(true);
        }
        /** @inheritdoc */
        onPause() {
            var _a, _b, _c, _d;
            (_a = this.destinationSub) === null || _a === void 0 ? void 0 : _a.pause();
            (_b = this.modeSub) === null || _b === void 0 ? void 0 : _b.pause();
            (_c = this.landingAltSub) === null || _c === void 0 ? void 0 : _c.pause();
            (_d = this.cabinSelectedAltSub) === null || _d === void 0 ? void 0 : _d.pause();
        }
        /**
         * Handles when the flight plan destination details are changed.
         * @param details The changed details.
         */
        onDestinationDetailsChanged(details) {
            var _a;
            const [facility, runway] = details;
            if (facility !== undefined) {
                if (runway !== undefined) {
                    this.fmsLandingAltitude.set(runway.elevation, msfssdk.UnitType.METER);
                }
                else {
                    this.fmsLandingAltitude.set((_a = msfssdk.AirportUtils.getElevation(facility)) !== null && _a !== void 0 ? _a : NaN, msfssdk.UnitType.METER);
                }
            }
            else {
                this.fmsLandingAltitude.set(NaN);
            }
            if (this.cabinAltitudeModeSetting.get() === CabinAltitudeMode.FMS) {
                this.displayedAltitude.set(this.fmsLandingAltitude.get());
            }
            this.facility.set(facility);
        }
        /**
         * Handles when the manually selected landing altitude setting has changed.
         * @param alt The altitude, in feet.
         */
        onLandingAltitudeChanged(alt) {
            alt = alt === -9999 ? NaN : alt;
            this.selectedLandingAltitude.set(alt);
            if (this.cabinAltitudeModeSetting.get() === CabinAltitudeMode.LandingAlt) {
                this.displayedAltitude.set(alt);
            }
        }
        /**
         * Handles when the manually selected cabin altitude setting has changed.
         * @param alt The altitude, in feet.
         */
        onCabinAltitudeChanged(alt) {
            alt = alt === -9999 ? NaN : alt;
            this.selectedCabinAltitude.set(alt);
            if (this.cabinAltitudeModeSetting.get() === CabinAltitudeMode.CabinAlt) {
                this.displayedAltitude.set(alt);
            }
        }
        /**
         * Handles when the cabin altitude mode has changed.
         * @param mode The cabin altitude mode.
         */
        onCabinAltitudeModeChanged(mode) {
            if (mode === CabinAltitudeMode.FMS) {
                const alt = this.fmsLandingAltitude.get().number;
                this.displayedAltitude.set(alt);
                this.normalMode = CabinAltitudeMode.FMS;
            }
            else if (mode === CabinAltitudeMode.LandingAlt) {
                const alt = this.selectedLandingAltitude.get().number;
                this.displayedAltitude.set(alt);
                this.normalMode = CabinAltitudeMode.LandingAlt;
            }
            else if (mode === CabinAltitudeMode.CabinAlt) {
                const alt = this.selectedCabinAltitude.get().number;
                this.displayedAltitude.set(alt);
            }
        }
        /** @inheritdoc */
        render() {
            return (msfssdk.FSComponent.buildComponent("div", { class: 'lng-press-page' },
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-press-page-mode lng-press-page-group' },
                    msfssdk.FSComponent.buildComponent("h2", null, "Mode"),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'Normal', ref: this.normalButton, state: this.normalState, onPressed: () => this.cabinAltitudeModeSetting.set(this.normalMode) }),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'Altitude<br>Select', ref: this.altitudeSelectButton, state: this.altitudeSelectState, onPressed: () => this.cabinAltitudeModeSetting.set(CabinAltitudeMode.CabinAlt) })),
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-press-page-alt lng-press-page-group' },
                    msfssdk.FSComponent.buildComponent("h2", null, this.altitudeSectionLabel),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcTouchButton, { ref: this.altitudeButton, label: this.renderAltButtonLabel(), onPressed: this.onAltButtonPressed.bind(this) }))));
        }
        /**
         * Handles when the altitude selection button is pressed.
         */
        onAltButtonPressed() {
            if (this.cabinAltitudeModeSetting.get() === CabinAltitudeMode.CabinAlt) {
                this.selectCabinAltitude();
            }
            else {
                this.selectLandingElevation();
            }
        }
        /**
         * Selects the landing elevation.
         */
        async selectLandingElevation() {
            const initialValue = this.displayedAltitude.get().number;
            const result = await this.gtcService.openPopup(LongitudeGtcKeys.LandingElevationDialog, 'normal', 'darken')
                .ref.request({
                type: 'landing',
                initialValue: isNaN(initialValue) ? 0 : initialValue,
                initialUnit: msfssdk.UnitType.FOOT,
                unitsMode: this.altitudeUnitsSetting.value === garminsdk.UnitsAltitudeSettingMode.Meters || this.altitudeUnitsSetting.value === garminsdk.UnitsAltitudeSettingMode.MetersMps
                    ? 'meters' : 'feet'
            });
            if (!result.wasCancelled) {
                if (result.payload === 'use-fms-destination') {
                    this.cabinAltitudeModeSetting.set(CabinAltitudeMode.FMS);
                }
                else {
                    this.cabinAltitudeModeSetting.set(CabinAltitudeMode.LandingAlt);
                    this.cabinLandingAltSetting.set(result.payload.altitudeUnit.convertTo(result.payload.altitude, msfssdk.UnitType.FOOT));
                }
            }
        }
        /**
         * Selects the cabin altitude.
         */
        async selectCabinAltitude() {
            const initialValue = this.displayedAltitude.get().number;
            const result = await this.gtcService.openPopup(LongitudeGtcKeys.LandingElevationDialog, 'normal', 'darken')
                .ref.request({
                type: 'cabin',
                initialValue: isNaN(initialValue) ? 0 : initialValue,
                initialUnit: msfssdk.UnitType.FOOT,
                unitsMode: this.altitudeUnitsSetting.value === garminsdk.UnitsAltitudeSettingMode.Meters || this.altitudeUnitsSetting.value === garminsdk.UnitsAltitudeSettingMode.MetersMps
                    ? 'meters' : 'feet'
            });
            if (!result.wasCancelled && result.payload !== 'use-fms-destination') {
                this.cabinSelectedAltSetting.set(result.payload.altitudeUnit.convertTo(result.payload.altitude, msfssdk.UnitType.FOOT));
            }
        }
        /**
         * Renders the altitude button label.
         * @returns The altitude button label.
         */
        renderAltButtonLabel() {
            return (msfssdk.FSComponent.buildComponent("div", { class: 'lng-press-alt-button-label' },
                msfssdk.FSComponent.buildComponent("div", { class: this.displayedAltitudeClass },
                    msfssdk.FSComponent.buildComponent(garminsdk.NumberUnitDisplay, { value: this.displayedAltitude, formatter: LongitudePressurizationPage.ALTITUDE_FORMATTER, displayUnit: msfssdk.UnitType.FOOT })),
                msfssdk.FSComponent.buildComponent("div", { class: this.displayedIcaoClass }, this.displayedIcao),
                msfssdk.FSComponent.buildComponent("div", { class: this.displayedNameClass }, this.displayedName)));
        }
        /** @inheritdoc */
        destroy() {
            var _a, _b, _c, _d, _e, _f;
            (_a = this.normalButton.getOrDefault()) === null || _a === void 0 ? void 0 : _a.destroy();
            (_b = this.altitudeSelectButton.getOrDefault()) === null || _b === void 0 ? void 0 : _b.destroy();
            (_c = this.altitudeButton.getOrDefault()) === null || _c === void 0 ? void 0 : _c.destroy();
            this.normalState.destroy();
            this.altitudeSelectState.destroy();
            this.altitudeSectionLabel.destroy();
            this.displayedAltitudeClass.destroy();
            this.displayedIcao.destroy();
            this.displayedIcaoClass.destroy();
            this.displayedName.destroy();
            this.displayedNameClass.destroy();
            this.destinationDetails.destroy();
            (_d = this.modeSub) === null || _d === void 0 ? void 0 : _d.destroy();
            (_e = this.landingAltSub) === null || _e === void 0 ? void 0 : _e.destroy();
            (_f = this.cabinSelectedAltSub) === null || _f === void 0 ? void 0 : _f.destroy();
            super.destroy();
        }
    }
    LongitudePressurizationPage.ALTITUDE_FORMATTER = msfssdk.NumberFormatter.create({ precision: 1, nanString: '____' });

    /**
     * The Longitude GTC propulsion controls page.
     */
    class LongitudePropulsionPage extends wtg3000gtc.GtcView {
        constructor() {
            super(...arguments);
            this.apuDataRef = msfssdk.FSComponent.createRef();
            this.apuOffRef = msfssdk.FSComponent.createRef();
            this.settings = LongitudeUserSettings.getManager(this.bus);
            this.apuRpmPct = msfssdk.ConsumerSubject.create(null, 0).pause();
            this.isApuRunning = this.apuRpmPct.map(pct => pct > 0);
            this.apuUsageCycles = this.settings.getSetting('apuUsageCycles').map(cycles => cycles.toString());
            this.apuUsageHours = this.settings.getSetting('apuUsageTime').map(t => Math.round(msfssdk.UnitType.SECOND.convertTo(t, msfssdk.UnitType.HOUR))).pause();
        }
        /** @inheritdoc */
        onAfterRender(node) {
            this._title.set('Propulsion');
            this.thisNode = node;
            this.apuRpmPct.setConsumer(this.bus.getSubscriber().on('apu_pct'));
            const isApuRunningSub = this.isApuRunning.sub(isRunning => {
                if (isRunning) {
                    this.apuDataRef.instance.classList.remove('hidden');
                    this.apuOffRef.instance.classList.add('hidden');
                }
            }, false, true);
            this.globalPowerSub = this.bus.getSubscriber().on('avionics_global_power').handle(event => {
                if (event.current === true) {
                    isApuRunningSub.resume(true);
                }
                else {
                    isApuRunningSub.pause();
                    this.apuDataRef.instance.classList.add('hidden');
                    this.apuOffRef.instance.classList.remove('hidden');
                }
            });
        }
        /** @inheritdoc */
        onResume() {
            this.apuRpmPct.resume();
            this.apuUsageHours.resume();
        }
        /** @inheritdoc */
        onPause() {
            this.apuRpmPct.pause();
            this.apuUsageHours.pause();
        }
        /** @inheritdoc */
        render() {
            return (msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page' },
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-left' },
                    msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-apu lng-prop-page-group' },
                        msfssdk.FSComponent.buildComponent("label", null, "APU"),
                        msfssdk.FSComponent.buildComponent("hr", null),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-apu-data hidden', ref: this.apuDataRef },
                            msfssdk.FSComponent.buildComponent("label", null, "Hours"),
                            msfssdk.FSComponent.buildComponent("div", null, this.apuUsageHours),
                            msfssdk.FSComponent.buildComponent("hr", null),
                            msfssdk.FSComponent.buildComponent("label", null, "Cycles"),
                            msfssdk.FSComponent.buildComponent("div", null, this.apuUsageCycles)),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-apu-off', ref: this.apuOffRef }, "OFF")),
                    msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { class: 'lng-prop-page-digitsbutton', label: 'Display<br>Engine Digits', state: this.settings.getSetting('ittEngineDigits') })),
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-right' },
                    msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-fadec lng-prop-page-group' },
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-fadec-engines' },
                            msfssdk.FSComponent.buildComponent("div", null, "L"),
                            msfssdk.FSComponent.buildComponent("div", null, "Engine"),
                            msfssdk.FSComponent.buildComponent("div", null, "R")),
                        msfssdk.FSComponent.buildComponent("hr", null),
                        msfssdk.FSComponent.buildComponent("div", null, "FADEC In Control"),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-fadec-control' },
                            msfssdk.FSComponent.buildComponent("div", null, "A"),
                            msfssdk.FSComponent.buildComponent("div", null, "A"))),
                    msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-engine-ign lng-prop-page-group' },
                        msfssdk.FSComponent.buildComponent("label", null, "Engine Ignition"),
                        msfssdk.FSComponent.buildComponent("hr", null),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-prop-page-engine-ign-buttoncontainer' },
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcSetValueTouchButton, { label: 'Normal', state: this.settings.getSetting('engineIgnitorsSetOn'), setValue: false }),
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcSetValueTouchButton, { label: 'On', state: this.settings.getSetting('engineIgnitorsSetOn'), setValue: true }))))));
        }
        /** @inheritdoc */
        destroy() {
            var _a;
            this.thisNode && msfssdk.FSComponent.shallowDestroy(this.thisNode);
            this.apuRpmPct.destroy();
            this.apuUsageCycles.destroy();
            this.apuUsageHours.destroy();
            (_a = this.globalPowerSub) === null || _a === void 0 ? void 0 : _a.destroy();
            super.destroy();
        }
    }

    /**
     * Citation Longitude display pane view keys.
     */
    var LongitudeDisplayPaneViewKeys;
    (function (LongitudeDisplayPaneViewKeys) {
        LongitudeDisplayPaneViewKeys["EcsSynoptics"] = "synoptics-ecs";
        LongitudeDisplayPaneViewKeys["FuelSynoptics"] = "synoptics-fuel";
        LongitudeDisplayPaneViewKeys["HydraulicsSynoptics"] = "synoptics-hyd";
        LongitudeDisplayPaneViewKeys["SummarySynoptics"] = "synoptics-summary";
        LongitudeDisplayPaneViewKeys["ElectricalSynoptics"] = "synoptics-electrical";
        LongitudeDisplayPaneViewKeys["FlightControlsSynoptics"] = "synoptics-flight-controls";
        LongitudeDisplayPaneViewKeys["AntiIceSynoptics"] = "synoptics-ai";
        LongitudeDisplayPaneViewKeys["PreFlightSynoptics"] = "synoptics-preflight";
    })(LongitudeDisplayPaneViewKeys || (LongitudeDisplayPaneViewKeys = {}));

    /**
     * A GTC page that displays the longitude systems page.
     */
    class LongitudeSystemsPage extends wtg3000gtc.GtcView {
        /**
         * Creates an instance of the LongitudeSystemsPage.
         * @param props The props to use with this page.
         */
        constructor(props) {
            super(props);
            this.tabContainerRef = msfssdk.FSComponent.createRef();
            if (this.props.displayPaneIndex === undefined) {
                throw new Error('LongitudeSystemsPage: display pane index was not defined');
            }
            this.displayPaneSettingManager = wtg3000common.DisplayPanesUserSettings.getDisplayPaneManager(this.bus, this.props.displayPaneIndex);
        }
        /** @inheritdoc */
        onAfterRender() {
            this._title.set('Aircraft Systems');
        }
        /** @inheritdoc */
        onResume() {
            this.tabContainerRef.instance.resume();
        }
        /** @inheritdoc */
        onPause() {
            this.tabContainerRef.instance.pause();
        }
        /**
         * Renders a settings tab for this page's tab container.
         * @param position The position of the tab.
         * @param label The tab label.
         * @param renderContent A function which renders the tab contents.
         * @returns A settings tab for this page's tab container, as a VNode.
         */
        renderTab(position, label, renderContent) {
            const contentRef = msfssdk.FSComponent.createRef();
            const sidebarState = msfssdk.Subject.create(null);
            return (msfssdk.FSComponent.buildComponent(wtg3000gtc.TabbedContent, { position: position, label: label, onPause: () => {
                    this._activeComponent.set(null);
                    sidebarState.set(null);
                }, onResume: () => {
                    this._activeComponent.set(contentRef.getOrDefault());
                    sidebarState.set(this._sidebarState);
                }, onDestroy: () => {
                    var _a;
                    (_a = contentRef.getOrDefault()) === null || _a === void 0 ? void 0 : _a.destroy();
                }, disabled: renderContent === undefined }, renderContent && renderContent(contentRef, sidebarState)));
        }
        /**
         * Renders the Controls tab.
         * @param ref The reference to assign to the tab content.
         * @returns The Controls tab VNode.
         */
        renderControlsTab(ref) {
            return (msfssdk.FSComponent.buildComponent(SystemsPageTabContent, { ref: ref },
                msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-page-tabcontent' },
                    msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-icon-row' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Cabin<br>Management', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_cabin.png', isEnabled: false, class: 'gtc-directory-button cabin-management' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Temp', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_small_ecs.png', isEnabled: true, class: 'gtc-directory-button', onPressed: () => this.gtcService.changePageTo(LongitudeGtcKeys.Temp) }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Cabin<br>Pressure', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_small_cabin_pressure.png', isEnabled: true, class: 'gtc-directory-button', onPressed: () => this.gtcService.changePageTo(LongitudeGtcKeys.CabinPressure) })),
                    msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-icon-row' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Exterior<br>Lights', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_external_lighting.png', isEnabled: true, class: 'gtc-directory-button', onPressed: () => this.gtcService.changePageTo(LongitudeGtcKeys.ExteriorLights) }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Propulsion', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_small_systems_turbine.png', isEnabled: true, class: 'gtc-directory-button', onPressed: () => this.gtcService.changePageTo(LongitudeGtcKeys.Propulsion) }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Stall<br>Schedule', isEnabled: false, class: 'gtc-directory-button' })),
                    msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-icon-row' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'System<br>Tests', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_self_test.png', isEnabled: false, class: 'gtc-directory-button' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Alert<br>Suppression', isEnabled: false, class: 'gtc-directory-button' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcImgTouchButton, { label: 'Maintenance', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_small_maintenance.png', isEnabled: false, class: 'gtc-directory-button maintenance' })))));
        }
        /**
         * Renders the Controls tab.
         * @param ref The reference to assign to the tab content.
         * @returns The Controls tab VNode.
         */
        renderSynopticsTab(ref) {
            return (msfssdk.FSComponent.buildComponent(SystemsPageTabContent, { ref: ref },
                msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-page-tabcontent' },
                    msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-icon-row' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.ElectricalSynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.ElectricalSynoptics, label: 'Electrical', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_small_electrical.png', class: 'gtc-directory-button lower' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.HydraulicsSynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.HydraulicsSynoptics, label: 'Hydraulics', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_small_hydraulics.png', class: 'gtc-directory-button lower' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.FuelSynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.FuelSynoptics, label: 'Fuel', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_small_fuel.png', class: 'gtc-directory-button lower' })),
                    msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-icon-row' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.AntiIceSynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.AntiIceSynoptics, label: 'Anti-Ice', class: 'gtc-directory-button lower' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.EcsSynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.EcsSynoptics, label: 'Bleed<br>Air/ECS', class: 'gtc-directory-button' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.FlightControlsSynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.FlightControlsSynoptics, label: 'Flight<br>Controls', class: 'gtc-directory-button' })),
                    msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-icon-row' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.PreFlightSynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.PreFlightSynoptics, label: 'Pre-Flight', class: 'gtc-directory-button lower' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcDesignatedPaneButton, { displayPaneSettingManager: this.displayPaneSettingManager, selectedPaneViewKeys: [LongitudeDisplayPaneViewKeys.SummarySynoptics], getPaneViewKeyToDesignate: () => LongitudeDisplayPaneViewKeys.SummarySynoptics, label: 'Summary', imgSrc: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_setup_systems.png', class: 'gtc-directory-button lower' })))));
        }
        /** @inheritdoc */
        render() {
            return (msfssdk.FSComponent.buildComponent("div", { class: 'longitude-systems-page' },
                msfssdk.FSComponent.buildComponent(wtg3000gtc.TabbedContainer, { ref: this.tabContainerRef, configuration: wtg3000gtc.TabConfiguration.Left5, class: 'longitude-systems-page-tabs' },
                    this.renderTab(1, 'Controls', this.renderControlsTab.bind(this)),
                    this.renderTab(2, 'Synoptics', this.renderSynopticsTab.bind(this)))));
        }
        /** @inheritdoc */
        destroy() {
            var _a;
            (_a = this.tabContainerRef.getOrDefault()) === null || _a === void 0 ? void 0 : _a.destroy();
            super.destroy();
        }
    }
    /**
     * A basic component for displaying systems page tab content.
     */
    class SystemsPageTabContent extends msfssdk.DisplayComponent {
        /** @inheritdoc */
        onGtcInteractionEvent() {
            return false;
        }
        /** @inheritdoc */
        render() {
            return (msfssdk.FSComponent.buildComponent(msfssdk.FSComponent.Fragment, null, this.props.children));
        }
    }

    /**
     * A class for generating formatters for synoptic display number values.
     */
    class SynopticNumberFormatter {
        /**
         * Creates a formatter for values with rounding to the specified precsion and hysteresis of 7/10ths of the
         * precision.
         * @param precision The precision of the formatter.
         * @param min The minimum value at or below which the formatter will report 0.
         * @returns The number formatter.
         */
        static create(precision, min = Number.NEGATIVE_INFINITY) {
            let currentVal = NaN;
            let currentValString = '';
            const hysteresis = 7 * (precision / 10);
            const decimals = SynopticNumberFormatter.countDecimals(precision);
            return (val) => {
                const valToPrecision = Math.round(val / precision) * precision;
                if (isNaN(currentVal)) {
                    currentVal = valToPrecision;
                    currentValString = currentVal.toFixed(decimals);
                }
                if (val <= min) {
                    if (currentVal !== 0) {
                        currentVal = 0;
                        currentValString = currentVal.toFixed(decimals);
                    }
                }
                else if (val >= currentVal + hysteresis || val <= currentVal - hysteresis) {
                    currentVal = valToPrecision;
                    currentValString = currentVal.toFixed(decimals);
                }
                return currentValString;
            };
        }
        /**
         * Counts the number of decimals for precision.
         * @param decimal The number to count.
         * @returns The number of decimals.
         */
        static countDecimals(decimal) {
            const num = parseFloat(decimal.toString());
            if (Number.isInteger(num) === true) {
                return 0;
            }
            const text = num.toString();
            if (text.indexOf('e-') > -1) {
                const split = text.split('e-');
                const deg = parseInt(split[1], 10);
                return deg;
            }
            else {
                const index = text.indexOf('.');
                return text.length - index - 1;
            }
        }
    }

    /**
     * The Longitude temperature controls page.
     */
    class LongitudeTemperaturePage extends wtg3000gtc.GtcView {
        constructor() {
            super(...arguments);
            this.currentStops = msfssdk.Subject.create(LongitudeTemperaturePage.STOPS_CELSIUS);
            this.recircFanState = LongitudeUserSettings.getManager(this.bus).getSetting('recircFanSpeed');
            this.cockpitTemp = LongitudeUserSettings.getManager(this.bus).getSetting('cockpitSetTemperature');
            this.cabinTemp = LongitudeUserSettings.getManager(this.bus).getSetting('cabinSetTemperature');
            this.tempUnits = LongitudeUserSettings.getManager(this.bus).getSetting('temperatureControlUnits');
            this.cockpitSliderState = msfssdk.Subject.create(0);
            this.cabinSliderState = msfssdk.Subject.create(0);
            this.cabinControl = msfssdk.Subject.create(false);
            this.cabinSupplyTemp = msfssdk.ConsumerSubject.create(this.bus.getSubscriber().on('ecs-cabin-supply-temp'), NaN).pause();
            this.cockpitSupplyTemp = msfssdk.ConsumerSubject.create(this.bus.getSubscriber().on('ecs-cockpit-supply-temp'), NaN).pause();
            this.cabinCurrentTemp = msfssdk.ConsumerSubject.create(this.bus.getSubscriber().on('ecs-cabin-current-temp'), NaN).pause();
            this.cockpitCurrentTemp = msfssdk.ConsumerSubject.create(this.bus.getSubscriber().on('ecs-cockpit-current-temp'), NaN).pause();
            this.cockpitTempCelsius = this.cockpitTemp.map(v => this.tempUnits.get() === EcsTemperatureUnits.Fahrenheit ? msfssdk.UnitType.FAHRENHEIT.convertTo(v, msfssdk.UnitType.CELSIUS) : v);
            this.cabinTempCelsius = this.cabinTemp.map(v => this.tempUnits.get() === EcsTemperatureUnits.Fahrenheit ? msfssdk.UnitType.FAHRENHEIT.convertTo(v, msfssdk.UnitType.CELSIUS) : v);
            this.temps = [
                this.cabinSupplyTemp,
                this.cockpitSupplyTemp,
                this.cabinCurrentTemp,
                this.cockpitCurrentTemp,
                this.cockpitTempCelsius,
                this.cabinTempCelsius
            ];
        }
        /** @inheritdoc */
        onAfterRender(thisNode) {
            this.thisNode = thisNode;
            this._title.set('Temperature');
            this.cockpitTemp.sub(temp => { this.setSlider(this.cockpitSliderState, temp); });
            this.cabinTemp.sub(temp => { this.setSlider(this.cabinSliderState, temp); });
            this.tempUnits.sub(() => {
                this.setSlider(this.cockpitSliderState, this.cockpitTemp.get());
                this.setSlider(this.cabinSliderState, this.cabinTemp.get());
            }, true);
        }
        /** @inheritdoc */
        onResume() {
            this.temps.forEach(temp => { temp.resume(); });
        }
        /** @inheritdoc */
        onPause() {
            this.temps.forEach(temp => { temp.pause(); });
        }
        /**
         * Changes the temperature.
         * @param setting The temperature setting to change.
         * @param slider The slider to change.
         * @param value The amount to change by.
         */
        changeTemp(setting, slider, value) {
            if (this.tempUnits.get() === EcsTemperatureUnits.Celsius) {
                setting.set(msfssdk.MathUtils.clamp(value, 19, 29));
            }
            else {
                setting.set(msfssdk.MathUtils.clamp(value, 65, 85));
            }
            this.setSlider(slider, setting.get());
        }
        /**
         * Sets the slider state.
         * @param state The slider state to change.
         * @param value The temperature value to translate.
         */
        setSlider(state, value) {
            if (this.tempUnits.get() === EcsTemperatureUnits.Celsius) {
                state.set((value - 19) / 10);
            }
            else {
                state.set((value - 65) / 20);
            }
        }
        /**
         * Gets a temp from a slider value.
         * @param value The temperature value to translate.
         * @returns The translated value.
         */
        sliderToTemp(value) {
            if (this.tempUnits.get() === EcsTemperatureUnits.Celsius) {
                return (value * 10) + 19;
            }
            else {
                return (value * 20) + 65;
            }
        }
        /**
         * Toggles the units control setting.
         */
        toggleUnits() {
            if (this.tempUnits.get() === EcsTemperatureUnits.Celsius) {
                this.tempUnits.set(EcsTemperatureUnits.Fahrenheit);
                this.currentStops.set(LongitudeTemperaturePage.STOPS_FAHRENHEIT);
                this.changeTemp(this.cabinTemp, this.cabinSliderState, Math.round(msfssdk.UnitType.CELSIUS.convertTo(this.cabinTemp.get(), msfssdk.UnitType.FAHRENHEIT)));
                this.changeTemp(this.cockpitTemp, this.cockpitSliderState, Math.round(msfssdk.UnitType.CELSIUS.convertTo(this.cockpitTemp.get(), msfssdk.UnitType.FAHRENHEIT)));
            }
            else {
                this.tempUnits.set(EcsTemperatureUnits.Celsius);
                this.currentStops.set(LongitudeTemperaturePage.STOPS_CELSIUS);
                this.changeTemp(this.cabinTemp, this.cabinSliderState, Math.round(msfssdk.UnitType.FAHRENHEIT.convertTo(this.cabinTemp.get(), msfssdk.UnitType.CELSIUS)));
                this.changeTemp(this.cockpitTemp, this.cockpitSliderState, Math.round(msfssdk.UnitType.FAHRENHEIT.convertTo(this.cockpitTemp.get(), msfssdk.UnitType.CELSIUS)));
            }
        }
        /** @inheritdoc */
        render() {
            return (msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-page-container' },
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-page-row' },
                    msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-page-cockpitbuttons' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcListSelectTouchButton, { label: 'Recirc Fan', state: this.recircFanState, gtcService: this.gtcService, listDialogKey: wtg3000gtc.GtcViewKeys.ListDialog1, listParams: {
                                title: 'Select Recirc Fan Speed',
                                selectedValue: this.recircFanState,
                                inputData: [
                                    { value: RecircFanSpeed.Off, labelRenderer: () => RecircFanSpeed.Off },
                                    { value: RecircFanSpeed.Low, labelRenderer: () => RecircFanSpeed.Low },
                                    { value: RecircFanSpeed.High, labelRenderer: () => RecircFanSpeed.High }
                                ]
                            } })),
                    msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-group touch-button' },
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-group-label' }, "Cockpit"),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-slider' },
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcTouchButton, { onPressed: () => this.changeTemp(this.cockpitTemp, this.cockpitSliderState, this.cockpitTemp.get() - 1) },
                                msfssdk.FSComponent.buildComponent("img", { src: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_minus_left.png' })),
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.TouchSlider, { bus: this.bus, orientation: 'to-right', state: this.cockpitSliderState, onValueChanged: (val) => this.changeTemp(this.cockpitTemp, this.cockpitSliderState, this.sliderToTemp(val)), changeValueOnDrag: true, lockFocusOnDrag: true, stops: this.currentStops, foreground: msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-slider-bar' }), background: msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-slider-bar' }), thumb: msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcSliderThumbIcon, { sliderOrientation: 'horizontal' }) }),
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcTouchButton, { onPressed: () => this.changeTemp(this.cockpitTemp, this.cockpitSliderState, this.cockpitTemp.get() + 1) },
                                msfssdk.FSComponent.buildComponent("img", { src: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_plus_right.png' }))),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-displays' },
                            msfssdk.FSComponent.buildComponent(TempDisplay, { label: 'Selected', class: 'lng-temp-display-cyan', temp: this.cockpitTempCelsius, units: this.tempUnits }),
                            msfssdk.FSComponent.buildComponent(TempDisplay, { label: 'Current', temp: this.cockpitCurrentTemp, units: this.tempUnits }),
                            msfssdk.FSComponent.buildComponent(TempDisplay, { label: 'Supply', temp: this.cockpitSupplyTemp, units: this.tempUnits })))),
                msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-page-row' },
                    msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-page-cabinbuttons' },
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcToggleTouchButton, { label: 'Cabin<br>Control', state: this.cabinControl, isEnabled: false, class: 'lng-temp-page-cabin-control-button' }),
                        msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcValueTouchButton, { label: 'Units', state: this.tempUnits, renderValue: (v) => v === EcsTemperatureUnits.Celsius ? '°C' : '°F', onPressed: this.toggleUnits.bind(this), class: 'lng-temp-page-units-button' })),
                    msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-group touch-button' },
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-group-label' }, "Cabin"),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-slider' },
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcTouchButton, { onPressed: () => this.changeTemp(this.cabinTemp, this.cabinSliderState, this.cabinTemp.get() - 1) },
                                msfssdk.FSComponent.buildComponent("img", { src: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_minus_left.png' })),
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.TouchSlider, { bus: this.bus, orientation: 'to-right', state: this.cabinSliderState, onValueChanged: (val) => this.changeTemp(this.cabinTemp, this.cabinSliderState, this.sliderToTemp(val)), changeValueOnDrag: true, lockFocusOnDrag: true, stops: this.currentStops, foreground: msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-slider-bar' }), background: msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-slider-bar' }), thumb: msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcSliderThumbIcon, { sliderOrientation: 'horizontal' }) }),
                            msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcTouchButton, { onPressed: () => this.changeTemp(this.cabinTemp, this.cabinSliderState, this.cabinTemp.get() + 1) },
                                msfssdk.FSComponent.buildComponent("img", { src: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG3000/Assets/Images/GTC/icon_plus_right.png' }))),
                        msfssdk.FSComponent.buildComponent("div", { class: 'lng-temp-displays' },
                            msfssdk.FSComponent.buildComponent(TempDisplay, { label: 'Selected', class: 'lng-temp-display-cyan', temp: this.cabinTempCelsius, units: this.tempUnits }),
                            msfssdk.FSComponent.buildComponent(TempDisplay, { label: 'Current', temp: this.cabinCurrentTemp, units: this.tempUnits }),
                            msfssdk.FSComponent.buildComponent(TempDisplay, { label: 'Supply', temp: this.cabinSupplyTemp, units: this.tempUnits }))))));
        }
        /** @inheritdoc */
        destroy() {
            this.thisNode && msfssdk.FSComponent.shallowDestroy(this.thisNode);
            this.temps.forEach(temp => { temp.destroy(); });
            super.destroy();
        }
    }
    LongitudeTemperaturePage.STOPS_CELSIUS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
    LongitudeTemperaturePage.STOPS_FAHRENHEIT = [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95, 1];
    /**
     * Displays a temp page temp.
     */
    class TempDisplay extends msfssdk.DisplayComponent {
        constructor() {
            super(...arguments);
            this.displayRef = msfssdk.FSComponent.createRef();
            this.value = msfssdk.NumberUnitSubject.create(msfssdk.UnitType.CELSIUS.createNumber(NaN));
            this.unit = this.props.units.map(d => d === EcsTemperatureUnits.Celsius ? msfssdk.UnitType.CELSIUS : msfssdk.UnitType.FAHRENHEIT);
        }
        /** @inheritdoc */
        onAfterRender() {
            this.valuePipe = this.props.temp.pipe(this.value);
        }
        /** @inheritdoc */
        render() {
            var _a;
            return (msfssdk.FSComponent.buildComponent("div", { class: `lng-temp-temp-display ${(_a = this.props.class) !== null && _a !== void 0 ? _a : ''}` },
                msfssdk.FSComponent.buildComponent("label", null, this.props.label),
                msfssdk.FSComponent.buildComponent(garminsdk.NumberUnitDisplay, { ref: this.displayRef, value: this.value, displayUnit: this.unit, formatter: TempDisplay.FORMATTER })));
        }
        /** @inheritdoc */
        destroy() {
            var _a, _b;
            (_a = this.displayRef.getOrDefault()) === null || _a === void 0 ? void 0 : _a.destroy();
            this.unit.destroy();
            (_b = this.valuePipe) === null || _b === void 0 ? void 0 : _b.destroy();
            super.destroy();
        }
    }
    TempDisplay.FORMATTER = SynopticNumberFormatter.create(1);

    /**
     * A plugin that connect the GTC pages for Longitude systems.
     */
    class LongitudeSystemsPlugin extends wtg3000gtc.AbstractG3000GtcPlugin {
        /** @inheritdoc */
        registerGtcViews(gtcService) {
            gtcService.registerView(wtg3000gtc.GtcViewLifecyclePolicy.Transient, wtg3000gtc.GtcViewKeys.AircraftSystems, 'MFD', (service, mode, index) => msfssdk.FSComponent.buildComponent(LongitudeSystemsPage, { gtcService: service, controlMode: mode, displayPaneIndex: index }));
            gtcService.registerView(wtg3000gtc.GtcViewLifecyclePolicy.Transient, LongitudeGtcKeys.Temp, 'MFD', (service, mode, index) => msfssdk.FSComponent.buildComponent(LongitudeTemperaturePage, { gtcService: service, controlMode: mode, displayPaneIndex: index }));
            gtcService.registerView(wtg3000gtc.GtcViewLifecyclePolicy.Transient, LongitudeGtcKeys.Propulsion, 'MFD', (service, mode, index) => msfssdk.FSComponent.buildComponent(LongitudePropulsionPage, { gtcService: service, controlMode: mode, displayPaneIndex: index }));
            gtcService.registerView(wtg3000gtc.GtcViewLifecyclePolicy.Transient, LongitudeGtcKeys.ExteriorLights, 'MFD', (service, mode, index) => msfssdk.FSComponent.buildComponent(LongitudeExteriorLightsPage, { gtcService: service, controlMode: mode, displayPaneIndex: index }));
            gtcService.registerView(wtg3000gtc.GtcViewLifecyclePolicy.Transient, LongitudeGtcKeys.CabinPressure, 'MFD', (service, mode, index) => {
                return (msfssdk.FSComponent.buildComponent(LongitudePressurizationPage, { bus: this.binder.bus, gtcService: service, controlMode: mode, displayPaneIndex: index, flightPlanStore: this.binder.flightPlanStore }));
            });
            gtcService.registerView(wtg3000gtc.GtcViewLifecyclePolicy.Transient, LongitudeGtcKeys.LandingElevationDialog, 'MFD', (service, mode, index) => msfssdk.FSComponent.buildComponent(wtg3000gtc.GtcPressurizationDialog, { gtcService: service, controlMode: mode, displayPaneIndex: index }));
        }
    }
    msfssdk.registerPlugin(LongitudeSystemsPlugin);

    exports.LongitudeGtcCssPlugin = LongitudeGtcCssPlugin;
    exports.LongitudeSystemsPlugin = LongitudeSystemsPlugin;

    return exports;

})({}, msfssdk, wtg3000gtc, garminsdk, wtg3000common);

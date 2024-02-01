import PYTZ_TIMEZONES from '@dugrema/millegrilles.utiljs/res/pytz_timezones.json'

export function OptionsTimezones(props) {
    return PYTZ_TIMEZONES.map(tz=>{
        return (
            <option key={tz} value={tz}>
                {tz}
            </option>
        )
    })
}


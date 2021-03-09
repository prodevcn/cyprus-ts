/* eslint-disable camelcase */
export default class CleanHl7 {
  private raw
  public data

  public constructor(clutter) {
    this.raw = clutter
    const { ...defrag } = clutter

    this.data = CleanHl7.formData(defrag.oru_r01_response)
    return this
  }

  public static formData(oruResponse): any {
    return {
      observations: CleanHl7.parseObr(oruResponse.oru_r01_order_observation)
      // patient: CleanHl7.getPatient(oruResponse.oru_r01_patient)
    }
  }

  public static parseObx(obxArr): any {
    const arr = CleanHl7.makeArray(obxArr)
    return arr
      .map((item): any => item.obx)
      // eslint-disable-next-line complexity
      .map((item): any => {
        const range = item.references_range && item.references_range.st && item.references_range.st.st
        const value = item.observation_value && item.observation_value.varies_1 && item.observation_value.varies_1.st
        const abnormalFlags = item.abnormal_flags && item.abnormal_flags.id && item.abnormal_flags.id.id
        let displayKey = 'value'
        if (!range && !value && abnormalFlags)
          displayKey = 'abnormalFlags'

        //TODO Add < or > instead of removing this filter
        // if (range && !range.match(/^-?\d+\.*\d*\s*-\s*-?\d+\.*\d*/u))
        //   displayKey = 'invalid'
        return {
          abnormalFlags,
          observResultStatus: item.observ_result_status && item.observ_result_status.id && item.observ_result_status.id.id,
          observationIdentifier: item.observation_identifier && item.observation_identifier.text && item.observation_identifier.text.st,
          value,
          range,
          units: item.units && item.units.text && item.units.text.st,
          type: item.value_type && item.value_type.id && item.value_type.id.id,
          displayKey
        }
      });
  }

  public static getObrInfo(obr): any {
    if (obr) {
      return {
        endDate: {
          value: obr.observation_end_date_time && obr.observation_end_date_time.time_of_an_event && obr.observation_end_date_time.time_of_an_event.st,
          label: 'Observation End Date Time',
          type: 'date'
        },
        // placer: {
        //     value: obr.placer_field_1.st.st,
        //     label: "Placer Field",
        //     type: "string"
        // },
        // specimenReceivedDateTime: {
        //     value: obr.specimen_received_date_time.time_of_an_event.st,
        //     label: "Specimen Received Date Time",
        //     type: "date"
        // },
        universalServiceIdentifier: {
          id: obr.universal_service_identifier.identifier.id,
          label: obr.universal_service_identifier.text.st
          // nameOfCodingSystem: obr.universal_service_identifier.name_of_coding_system.st
        }
      }
    }
    return {
      endDate: {
        value: '',
        label: 'Observation End Date Time',
        type: 'date'
      },
      //     type: "date"
      // },
      universalServiceIdentifier: {
        id: '',
        label: ''
        // nameOfCodingSystem: obr.universal_service_identifier.name_of_coding_system.st
      }
    }

  }

  public static parseObr(oruArr): any {
    const arr = CleanHl7.makeArray(oruArr)
    return arr.map((oru): any => {
      return {
        obr: CleanHl7.getObrInfo(oru.obr),
        obx: CleanHl7.parseObx(oru.oru_r01_observation)
      }
    })
  }

  public static makeArray(obj): any {
    if (!Array.isArray(obj))
      return [obj]
    return obj
  }

  public static getPatient(oruPatient): any {
    const { pid } = oruPatient
    return {
      ...pid.patient_name
    }
  }

}
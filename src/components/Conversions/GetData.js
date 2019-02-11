import React, { Component } from 'react'
import { Form, Input, Button, message, DatePicker, Modal } from 'antd'
import Helpers, { Filters, t, clean, TreeSelectRemote } from '../../common/Helpers'
import api from '../../common/Api'
import moment from 'moment'
import fileSaver from 'file-saver'
import SearchSelect from '../../common/Helpers/SearchSelect'
import * as Manager from '../../common/Helpers/ManagerSelect'
import ReviseStatus from '../../common/ReviseStatus/ReviseStatus'

const { RangePicker } = DatePicker

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

class Filter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      isVisible: false,
    }
  }

  prepareQueryParams = (values) => {
    const skip = ['group']
    const filters = {}
    const keys = Object.keys(values)
    if(!keys.length) return filters
    keys.forEach(key => {
      const val = values[key]
      const isArray = Array.isArray(val)
      if(!val || skip.includes(key) || isArray && !val.length) return
      if(isArray) {
        if(['created_at', 'date'].includes(key)) {
          const start = val[0] && val[0].startOf('day').unix()
          const end = val[1] && val[1].endOf('day').unix()
          if(start && end) {
            filters.startDate = start
            filters.endDate = end
          }
        } else {
          switch (key) {
            case 'advertiser_id':
              filters.advertiserId = val.join(',')
              break;
            case 'offer_id':
              filters.offerIds = val.join(',')
              break;
            default:
              filters[key] = val.join(',')
          }
        }
      } else {
        switch (key) {
          case 'advertiser_id':
            filters.advertiserId = val
            break;
          case 'offer_id':
            filters.offerIds = val
            break;
          default:
            filters[key] = val
        }
      }
    })
    return filters
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      clean(values)
      const queryParams = this.prepareQueryParams(values)
      this.setState({ isLoading: true })

      api.get('/v1/hit-actions/export', {
        params: {
          ...queryParams,
        }
      })
      .then(response => {
        this.setState({
          isLoading: false
          })
        message.success('Данные успешно загружены')

        const blob = new Blob([response.data], {type: 'text/csv;charset=utf-8'})
        fileSaver.saveAs(blob, "выгрузка.csv")
      })
      .catch(e => {
        this.setState({ isLoading: false })
        Helpers.errorHandler(e)
      })

    })
  }

  validator = (name, label, input) => {
    const { getFieldDecorator } = this.props.form
    const options = {  }
    return (
      <Form.Item className={`filter__field-${name}`}>
        <h4>{label}</h4>
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  _toggle = () => this.setState({ isVisible: !this.state.isVisible })

  render() {
    const { isVisible, isLoading } = this.state
    const { reviseStatuses } = this.props
    return (
      <div>
        <Button onClick={this._toggle} style={{ marginTop: '26px', borderColor: '#20ae0e', color: '#20ae0e' }} size="large">Выгрузить данные</Button>
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
            <Form>

              {this.validator('created_at', 'Дата', <RangePicker format="DD.MM.YYYY" {...options} /> )}
              {this.validator('offer_id', 'Оффер', <TreeSelectRemote target="/v1/offers" {...options}/> )}
              {this.validator('advertiser_id', 'Рекламодатель', <TreeSelectRemote target="/v1/advertisers" {...options} treeCheckable={false} /> )}
              {this.validator(Manager.data.personalManager.field, Manager.data.personalManager.title, <Manager.Select managerType="personalManager" multiple={true} {...options} /> )}
              {this.validator(Manager.data.advertiserManager.field, Manager.data.advertiserManager.title, <Manager.Select managerType="advertiserManager" multiple={true} {...options} /> )}
              {this.validator('reviseStatuses', 'Статус сверки', <ReviseStatus reviseStatuses={reviseStatuses} {...options} /> )}

              <Form.Item style={{ marginBottom: 0 }}>
                <h4>&nbsp;</h4>
                <Button type="primary" size="large" loading={isLoading} onClick={this.handleSubmit}>
                  Скачать
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
    )
  }
}
export default Form.create()(Filter)

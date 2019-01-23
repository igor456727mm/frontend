import React, { Component } from 'react'
import { Form, Button, message, DatePicker, Select } from 'antd'
import Helpers, { Filters, t, clean, TreeSelectRemote } from '../../common/Helpers'
import api from '../../common/Api'
import moment from 'moment'
import fileSaver from 'file-saver'
import SearchSelect from '../../common/Helpers/SearchSelect'

const { RangePicker } = DatePicker

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

const SelectGroup = (
  <Select allowClear {...options} >
    <Select.Option key={0} value='offer'>Оффер</Select.Option>
    <Select.Option key={1} value='personalManager'>Персональный менеджер</Select.Option>
    <Select.Option key={2} value='advertiserManager'>Менеджер рекламодателя</Select.Option>
  </Select>
)

class Filter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
    }
  }

  prepareQueryParams = (values) => {
    const filters = {}
    const keys = Object.keys(values)
    if(!keys.length) return filters
    keys.forEach(key => {
      const val = values[key]
      const isArray = Array.isArray(val)
      if(!val || isArray && !val.length) return
      if(isArray) {
        if(['created_at', 'date'].includes(key)) {
          const start = val[0] && val[0].startOf('day').unix()
          const end = val[1] && val[1].endOf('day').unix()
          if(start && end) filters[`q[${key}][between]`] = `${start},${end}`
        } else {
          filters[`q[${key}][in]`] = val.join(',')
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

      api.get('/v1/hit-actions/report', {
        params: {
          ...queryParams,
        }
      })
      .then(response => {
        const header = response.headers['content-disposition'] ? response.headers['content-disposition'] : ''
        const fileName = header.split('filename=')[1].split('"')[1]
        this.setState({
          isLoading: false
          })
        message.success('Отчет успешно загружен')

        const blob = new Blob([response.data], {type: 'text/csv;charset=utf-8'})
        fileSaver.saveAs(blob, (fileName ? fileName : "отчет.csv"))
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

  render() {
    const { isLoading } = this.state
    return (
      <Form>
        <div className="row">
          <div className="col-md-3">
            {this.validator('created_at', 'Период', <RangePicker format="DD.MM.YYYY" {...options} /> )}
            {this.validator('groupBy', 'Группировать по', SelectGroup )}
            <Form.Item>
              <h4>&nbsp;</h4>
              <Button type="primary" size="large" loading={isLoading} onClick={this.handleSubmit}>
                Скачать
              </Button>
            </Form.Item>
          </div>
        </div>
      </Form>
    )
  }
}
export default Form.create()(Filter)

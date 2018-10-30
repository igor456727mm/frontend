import React, { Component } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Form, Table, Icon, Divider, Select, Input, Button,Radio, message, Popconfirm, Tooltip,  DatePicker, Modal } from 'antd'
import Helpers, { Filters, t, pick, clean, disabledDate, TreeSelectRemote, queryParams } from '../../common/Helpers'
import api from '../../common/Api'
import axios from 'axios'
import { connect } from 'react-redux'
import moment from 'moment'
import locale from 'antd/lib/date-picker/locale/ru_RU'
import qs from 'qs'
import SearchSelect from '../../common/Helpers/SearchSelect'


const Option = Select.Option
const { RangePicker } = DatePicker

const options = {
  size: 'large',
  getPopupContainer: () => document.getElementById('content'),
}

export const initialFilter = {
  //group: 'action_day',
  // 'q[created_at][between]': `${moment().subtract(14, "days").startOf('day').unix()},${moment().endOf('day').unix()}`,
}

class _Filter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isVisible: false,
      type: 'revise-by-lead-id',
    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { type } = this.state
    this.props.form.validateFieldsAndScroll((err, values) => {
      clean(values)

      //created_at
      if(values.created_at && Array.isArray(values.created_at)) {
        const start = values.created_at[0].startOf('day').unix()
        const end = values.created_at[0].endOf('day').unix()
        if(start && end) values.created_at = [start, end].join(',')
      }

      const formData = new FormData()
      formData.append('csv-file', this.uploadInput.files[0])
      Object.keys(values).forEach(key => formData.append(key, values[key]));

      api.post(`/v1/hit-actions/${type}`, formData, {
        headers: {
            'content-type': 'multipart/form-data'
        }
      })
      .then(response => {
        message.success('Успешно загружено')
      })
      .catch(Helpers.errorHandler)

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

  _onChangeType = (e) => {
    const type = e.target.value
    this.setState({ type })
  }

  render() {
    const { isVisible, type } = this.state
    return (
      <span>
        <Button onClick={this._toggle} style={{ marginTop: '26px', borderColor: '#20ae0e', color: '#20ae0e' }} size="large">Загрузить сверку</Button>
        <Modal
          visible={isVisible}
          footer={null}
          onCancel={this._toggle}>
            <Form>
              <div className="ant-row ant-form-item filter__field-offer_id">
                <h4>Тип</h4>
                <Radio.Group onChange={this._onChangeType} value={type}>
                  <Radio value="revise-by-lead-id">Lead ID</Radio>
                  <Radio value="revise-by-stream">Поток</Radio>
                </Radio.Group>
              </div>
              {this.validator('created_at', 'Дата', <RangePicker format="DD.MM.YYYY" {...options} /> )}
              {type === 'revise-by-lead-id' ? (
                <div>
                  {this.validator('advertiser_id', 'Рекламодатель', <TreeSelectRemote target="/v1/advertisers" {...options}/> )}
                </div>
              ) : (
                <div>
                  {this.validator('dep_count', 'Количество депозитов', <Input size="large" /> )}
                  {this.validator('offer_id', 'Оффер', <TreeSelectRemote target="/v1/offers" {...options}/> )}
                </div>
              )}

              <input type="file" name="csv-file" ref={(ref) => { this.uploadInput = ref; }} />

              <Form.Item>
                <h4>&nbsp;</h4>
                <Button type="primary" size="large" onClick={this.handleSubmit}>Загрузить данные в систему</Button>
              </Form.Item>
            </Form>
          </Modal>
        </span>
    )
  }
}
export default Form.create()(_Filter)
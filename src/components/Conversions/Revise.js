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

class _Filter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isVisible: false,
      type: 'revise-by-stream',
      dryRun: 1,
      data: [],
      total: {},
      leadesDiff: [],
    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { type, dryRun } = this.state
    this.props.form.validateFieldsAndScroll((err, values) => {
      clean(values)

      //created_at
      if(values.created_at && Array.isArray(values.created_at)) {
        const start = values.created_at[0].startOf('day').unix()
        const end = values.created_at[1].endOf('day').unix()
        if(start && end) values.created_at = [start, end].join(',')
      }

      const formData = new FormData()
      formData.append('csv-file', this.uploadInput.files[0])
      formData.append('dryRun', dryRun)
      Object.keys(values).forEach(key => formData.append(key, values[key]))

      api.post(`/v1/hit-actions/${type}`, formData, {
        headers: {
            'content-type': 'multipart/form-data'
        }
      })
      .then(response => {

        const total = {
          leadCountDiff: response.data.leadCountDiff,
          leadCountRevise: response.data.leadCountRevise,
          leadCountSystem: response.data.leadCountSystem,
        }

        // if revise-by-stream first iteration
        if(type === 'revise-by-stream' && dryRun === 1) {
          const data = response.data.hitActionChanges.map(item => {
            return {
              stream_id: item.stream_id,
              in_system: item.hitActionChanges.length,
              in_revise: item.leads_count,
            }
          })
          this.setState({ data: data, dryRun: 0, total })
          return
        }

        message.success('Сверка успешно загружена')

        const leadesDiff = response.data.hitActionChanges.filter((item) => !Array.isArray(item.errors) && Object.keys(item.errors).length > 0)
        const leadesDiffWithErrors = leadesDiff.map((item) => {
          const errors = Object.keys(item.errors).reduce((acc, el) => [ ...acc, ...item.errors[el] ], [])
          return ({
            ...item,
            errors
          })
        })

        this.setState({
          data: [],
          dryRun: type === 'revise-by-stream' ? 1 : 0,
          total,
          leadesDiff: leadesDiffWithErrors,
        })
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

  _toggle = () => this.setState({ isVisible: !this.state.isVisible, data: [], dryRun: 1, total: {} })

  _onChangeType = (e) => {
    const type = e.target.value
    this.setState({ type, dryRun: type === 'revise-by-stream' ? 1 : 0 })
  }

  /*
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
  */

  renderLeadesDiff = () => {
    const { leadesDiff } = this.state
    const columns = [
            {
              title: 'lead id',
              dataIndex: 'lead_id',
              width: 90,
            },
            {
              title: 'Сумма',
              dataIndex: 'amount',
              width: 80,
            },
            {
              title: 'Ошибки',
              dataIndex: 'errors',
              render: (text) => {
                return text.join(', ')
              }
            },
          ]
    return (
      <div>
        <br />
        <h4>Отличия в лидах:</h4>
        <Table
          rowKey={(item) => item.lead_id}
          locale={{ emptyText: Helpers.emptyText }}
          columns={columns}
          dataSource={leadesDiff}
          />
      </div>
    )
  }

  render() {
    const { isVisible, type, data, dryRun, total, leadesDiff } = this.state
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
              {this.validator('advertiser_id', 'Рекламодатель', <TreeSelectRemote target="/v1/advertisers" {...options}/> )}

              <input type="file" name="csv-file" ref={(ref) => { this.uploadInput = ref; }} />

              {data.length && (
                <div className="revise-by-stream">
                  <table>
                    <thead>
                      <tr>
                        <th>ID потока</th>
                        <th>Лидов в системе</th>
                        <th>Лидов в сверке</th>
                        <th>Разница</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map(item => (
                        <tr key={item.stream_id} style={{
                          backgroundColor: +item.in_system - +item.in_revise ? 'lightpink' : 'none',
                        }}>
                          <td>{item.stream_id}</td>
                          <td>{item.in_system}</td>
                          <td>{item.in_revise}</td>
                          <td>{+item.in_system - +item.in_revise}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) || null}


              {total && Object.keys(total).length > 0 && (
                <div>
                  <br />
                  <h4>Результат</h4>
                  Лидов в системе: {total.leadCountSystem}
                  <br />Лидов в в сверке: {total.leadCountRevise}
                  <br />Разница: {total.leadCountDiff}
                </div>
              ) || null}

              {leadesDiff && Object.keys(leadesDiff).length > 0
                && (type === 'revise-by-lead-id') && this.renderLeadesDiff() || null}

              <Form.Item style={{ marginBottom: 0 }}>
                <h4>&nbsp;</h4>
                <Button type="primary" size="large" onClick={this.handleSubmit}>
                  {type === 'revise-by-stream' && dryRun === 1 ? 'Проверить данные' : 'Загрузить данные в систему'}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </span>
    )
  }
}
export default Form.create()(_Filter)

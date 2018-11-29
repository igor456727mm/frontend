import React, { Component } from 'react'
import { Form, Input, Button, message, DatePicker, Modal } from 'antd'
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

class Filter extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isLoading: false,
      isVisible: false,
    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      clean(values)
      const preparedValues = Filters.prepare(values)
      const timeValues = preparedValues['q[created_at][between]'].split(',')
      preparedValues.startDate = timeValues[0]
      preparedValues.endDate = timeValues[1]
      delete preparedValues['q[created_at][between]']
      this.setState({ isLoading: true })

      api.get('/v1/hit-actions/export', {
        params: {
          ...preparedValues,
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
              {this.validator('advertiser_id', 'Рекламодатель', <TreeSelectRemote target="/v1/advertisers" {...options}/> )}

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

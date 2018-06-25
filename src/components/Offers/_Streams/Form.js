import React, { Component } from 'react'
import { Form, Input, InputNumber, Button, Select, message, Checkbox, Popconfirm } from 'antd'
import { connect } from 'react-redux'
import qs from 'qs'
import api from '../../../common/Api'
import Helpers, { t, pick } from '../../../common/Helpers'
import copy from 'copy-to-clipboard'

class StreamLink extends Component {

  constructor(props) {
    super(props)
    this.state = {
      sub: null,
    }
  }

  _onChange = (e, v) => {
    this.setState({ sub: e.target.value })
  }

  _onCopy = () => {
    copy(this.refs.link.props.value)
    message.success(`streams.form.message.copied`)
  }

  render() {
    const { code } = this.props
    const { sub } = this.state
    const _sub = sub && `?sub=${sub}` || ''
    return (
      <div className="col-xs-12">
        <div className="flex">
          <Form.Item className="form__item-link">
            <h4>{t('field.link')}</h4>
            <Input size="large" ref={'link'} value={`http://hit.yb.partners/v1/add/${code}${_sub}`} disabled style={{ color: 'inherit', backgroundColor: '#fff'}} />
          </Form.Item>
          <Form.Item className="form__item-sub">
            <h4>{t('field.sub')}</h4>
            <Input size="large" placeholder="sub_id_1:sub_id_2:sub_id_3" onChange={this._onChange} />
          </Form.Item>
          <Form.Item>
            <h4>&nbsp;</h4>
            <Button type="primary" size="large" onClick={this._onCopy}>{t('button.copy')}</Button>
          </Form.Item>
        </div>
      </div>
    )
  }
}

class _Form extends Component {

  constructor(props) {
    super(props)
    this.state = {
      iconLoading: false,
      data: {
        id: this.props.match && this.props.match.params.id,
      },
    }
  }

  componentDidMount = () => {
    const { id } = this.state.data
    if(!id) return

    api.get(`v1/streams/${id}`)
    .then(response => {
      this.setState({ data: response.data })
    })
  }

  validator = (name, label, input, rules = [], initialValue) => {
    const { getFieldDecorator } = this.props.form
    const options = { rules: rules }
    options.initialValue = this.state.data[name]
    if(initialValue) options.initialValue = initialValue
    return (
      <Form.Item className={`form__item-${name}`}>
        {label && <h4>{label}</h4>}
        {getFieldDecorator(name, options)(input)}
      </Form.Item>
    )
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const { id } = this.state.data
    const { form, offer_id } = this.props
    form.validateFieldsAndScroll((err, values) => {
      if (err) return
      Object.keys(values).forEach(key => values[key] === undefined ? delete values[key] : '')
      values.offer_id = offer_id
      values.landings = JSON.stringify(values.landings)
      this.setState({ iconLoading: true })
      if(id) {
        api.patch(`/v1/streams/${id}`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('streams.form.message.save'))
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      } else {
        api.post(`/v1/streams`, qs.stringify(values))
        .then(response => {
          this.setState({ iconLoading: false })
          message.success(t('streams.form.message.add'))
          this.props.history.push(`/offers/${offer_id}/streams/${response.data.id}`)
        })
        .catch(e => {
          this.setState({ iconLoading: false })
          Helpers.errorHandler(e)
        })
      }
    })
  }

  renderLandings = () => {
    const { landings } = this.props
    const list = landings.map(item => {
      const link = item._links && `${item._links.self.href}/open`
      return (
        <tr key={item.id}>
          <td>
            <Checkbox value={item.id} key={item.id}></Checkbox>
          </td>
          <td>{item.name}</td>
          <td>
            <a href={link} target="_blank">{link}</a>
          </td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
          <td>-</td>
        </tr>
      )
    })

    return (
      <table className="ant-table">
        <thead className="ant-table-thead">
          <tr>
            <th></th>
            <th><div>{t('field.name')}</div></th>
            <th><div>URL</div></th>
            <th colSpan="2"><div>{t('field.by_stream')}</div><span>RATIO</span><span>CTR</span></th>
            <th colSpan="2"><div>{t('field.by_system')}</div><span>RATIO</span><span>CTR</span></th>
          </tr>
        </thead>
        <tbody className="ant-table-tbody">
          {list}
        </tbody>
      </table>
    )
  }

  _onDelete = () => {
    const { id } = this.state.data
    const { offer_id } = this.props
    api.delete(`/v1/streams/${id}`)
    .then(response => {
      this.props.history.push(`/offers/${offer_id}`)
    })
    .catch(e => {
      Helpers.errorHandler(e)
    })
  }

/*
<InputGroup compact>
          <Select defaultValue="Zhejiang">
            <Option value="Zhejiang">Zhejiang</Option>
            <Option value="Jiangsu">Jiangsu</Option>
          </Select>
          <Input style={{ width: '50%' }} defaultValue="Xihu District, Hangzhou" />
        </InputGroup>
        */
  render() {
    const { iconLoading, data } = this.state
    const { platforms } = this.props.user
    const _platforms = platforms.map(item => <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>)
    return (
      <Form onSubmit={this.handleSubmit}>
        <div className="row">
          {data.id && <StreamLink code={data.code} />}
          <div className="col-xs-12 col-md-4">
            {this.validator('name', t('field.name'), <Input size="large" />, [] )}
            {this.validator('platform_id', t('field.platform'), <Select size="large">{_platforms}</Select>, [] )}
            <div>
              <h4>Postback URL</h4>
              <div className="flex">
                {this.validator('postback_method', '', (
                  <Select size="large">
                    <Select.Option key={'get'}>GET</Select.Option>
                    <Select.Option key={'post'}>POST</Select.Option>
                  </Select>
                ), [], (data.postback_method || 'get'))}
                {this.validator('postback_url', '', <Input size="large"/>, [] )}
              </div>
            </div>
            {this.validator('postback_actions', t('field.activity'), (
              <Checkbox.Group>
                <Checkbox value="dep">{t('field.activity.dep')}</Checkbox>
                <Checkbox value="reg">{t('field.activity.reg')}</Checkbox>
                <Checkbox value="other">{t('field.activity.other')}</Checkbox>
              </Checkbox.Group>
            ))}
          </div>
          <div className="col-xs-12 col-md-8">
            {this.validator('landings', t('field.landings'), <Checkbox.Group>{this.renderLandings()}</Checkbox.Group> )}
          </div>
        </div>
        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" loading={iconLoading}>{data.id && t('button.save') || t('button.add')}</Button>
          {data.id && (
            <Popconfirm onConfirm={this._onDelete} title={t('delete.confirm')} okText={t('delete.ok')} cancelText={t('delete.cancel')}>
              <Button type="danger" size="large">{t('button.delete')}</Button>
            </Popconfirm>
          )}
        </Form.Item>
      </Form>
    )

  }


}



export default connect((state) => pick(state, 'user'))(Form.create()(_Form))

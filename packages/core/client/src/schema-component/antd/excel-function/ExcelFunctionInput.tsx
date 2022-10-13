import { Field, onFormSubmitValidateStart } from '@formily/core';
import { connect, mapProps, mapReadPretty, useField, useFieldSchema, useFormEffects } from '@formily/react';
import { Button, Input, Popover, Tag, Menu, Dropdown } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { useTranslation } from 'react-i18next';
import {Parser, SUPPORTED_FORMULAS}  from 'hot-formula-parser'
import { getParser } from './helpers';

const AntdExcelFormula = (props) => {
  const { value, onChange, supports, useCurrentFields } = props;
  const field = useField<Field>();
  const { t } = useTranslation();
  const fields = useCurrentFields();

  const inputRef = useRef();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [formula, setFormula] = useState(null);
  const [html, setHtml] = useState(null);

  const numColumns = new Map<string, string>();
  const scope = {};
  fields.forEach(field => {
    numColumns.set(field.name, field.uiSchema?.title);
    if (["string", "select", "text"].includes(field.type)) {
      scope[field.name] = "";
    } else if (["hasOne", "hasMany", "belongsTo", "belongsToMany"].includes(field.type)) {
      scope[field.name] = {};
    } else {
      scope[field.name] = 1;
    }
  })
  const keys = Array.from(numColumns.keys());

  let initHtml;
  if (value) {
    initHtml = value;
    numColumns.forEach((value, key) => {
      initHtml = initHtml.replaceAll(key, `<span contentEditable="false" style="border: 1px solid #aaa; padding: 2px 5px;">${value}</span>`)
    })    
  }

  useEffect(() => {
    if (onChange && formula) {
      let v = formula || '';
      numColumns.forEach((value, key) => {
        v = v.replaceAll(value, key);
      })
      if (v != value) {
        onChange(v);
      }
    }
  }, [formula])

  const menu = (
    <Menu onClick={async (args) => {
      const replaceFormula = formula.replace('@', numColumns.get(args.key));
      const replaceHtml = html.replace('@', `<span contentEditable="false" style="border: 1px solid #aaa; padding: 2px 5px;">${numColumns.get(args.key)}</span>`);
      setFormula(replaceFormula);
      setHtml(replaceHtml);
      setDropdownVisible(false);
    }}>
      {
        keys.map(key => (<Menu.Item key={key}>{numColumns.get(key)}</Menu.Item>))
      }
    </Menu>
  );

  const handleChange = (e) => {
    const current = inputRef.current as any;
    setFormula(e.currentTarget.textContent);
    setHtml(current.innerHTML);
    if (e.currentTarget.textContent == '' && onChange) {
      onChange(null);
    }
  }

  const handleKeyDown = (e) => {
    const {key} = e;
    switch (key) {
      case 'Enter':
        e.preventDefault();
        break;
      case '@':
      case 'Process':
        setDropdownVisible(true);
        break;
      default:
        setDropdownVisible(false);
        break;
    }
  }

  useFormEffects(() => {
    onFormSubmitValidateStart(() => {
      try {
        let parser = getParser(scope);
        let data = parser.parse(field.value);
        if (data.error) { //this is made non blocking due to unknown value results.
          console.warn("Possible error", data.error);
        }
        field.feedbacks = [];
      } catch {
        field.setFeedback({
          type: 'error',
          code: 'ExcelFunctionError',
          messages: [t('Excel error.')],
        });
      }
    })
  })

  return (
    <Dropdown overlay={menu} visible={dropdownVisible}>
      <ContentEditable
        innerRef={inputRef}
        className="ant-input"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        html={html || initHtml || ''}
      />
    </Dropdown>
  )
}

export const ExcelFunctionInput = connect(
  AntdExcelFormula,
  mapProps({
  }),
);

export default ExcelFunctionInput;
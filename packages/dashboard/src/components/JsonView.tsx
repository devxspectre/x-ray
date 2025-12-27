// JSON View component - shows JSON data nicely
interface Props {
  data: any
}

export default function JsonView({ data }: Props) {
  // Turn a value into nice colored JSX
  function renderValue(value: any): JSX.Element {
    // Null
    if (value === null) {
      return <span className="json-null">null</span>
    }

    // Boolean
    if (typeof value === 'boolean') {
      return <span className="json-boolean">{String(value)}</span>
    }

    // Number
    if (typeof value === 'number') {
      return <span className="json-number">{value}</span>
    }

    // String
    if (typeof value === 'string') {
      return <span className="json-string">"{value}"</span>
    }

    // Array
    if (Array.isArray(value)) {
      if (value.length === 0) return <span>[]</span>
      return (
        <>
          {'[\n'}
          {value.map((item, i) => (
            <span key={i}>
              {'  '}{renderValue(item)}
              {i < value.length - 1 ? ',' : ''}
              {'\n'}
            </span>
          ))}
          {']'}
        </>
      )
    }

    // Object
    if (typeof value === 'object') {
      const entries = Object.entries(value)
      if (entries.length === 0) return <span>{'{}'}</span>
      return (
        <>
          {'{\n'}
          {entries.map(([key, val], i) => (
            <span key={key}>
              {'  '}<span className="json-key">"{key}"</span>: {renderValue(val)}
              {i < entries.length - 1 ? ',' : ''}
              {'\n'}
            </span>
          ))}
          {'}'}
        </>
      )
    }

    // Fallback
    return <span>{String(value)}</span>
  }

  return (
    <pre className="json-viewer">
      {renderValue(data)}
    </pre>
  )
}

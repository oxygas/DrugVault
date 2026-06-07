declare module 'react-markdown' {
  import { ComponentType, ReactNode } from 'react'

  export interface Options {
    children?: string | null
    remarkPlugins?: any[]
    rehypePlugins?: any[]
    components?: Record<string, ComponentType<any>>
    [key: string]: any
  }

  const ReactMarkdown: ComponentType<Options>
  export default ReactMarkdown
}

/**
 * TransformationEngine - Applies text transformations using Unicode
 * Provides synchronous text transformation without API calls
 */

import type { TransformationStyle } from '@/types/common'
import * as transformationMaps from './transformationMaps'

export class TransformationEngine {
  /**
   * Transform text based on the specified style
   * @param text - Original text to transform
   * @param style - Transformation style to apply
   * @returns Transformed text
   */
  transform(text: string, style: TransformationStyle): string {
    if (!text) {
      return text
    }

    switch (style) {
      case 'strikethrough':
        return transformationMaps.applyStrikethrough(text)
      case 'upside-down':
        return transformationMaps.applyUpsideDown(text)
      case 'mirror':
        return transformationMaps.applyMirror(text)
      case 'bold':
        return transformationMaps.applyBold(text)
      case 'italic':
        return transformationMaps.applyItalic(text)
      case 'bold-italic':
        return transformationMaps.applyBoldItalic(text)
      case 'script':
        return transformationMaps.applyScript(text)
      case 'circled':
        return transformationMaps.applyCircled(text)
      case 'squared':
        return transformationMaps.applySquared(text)
      case 'monospace':
        return transformationMaps.applyMonospace(text)
      case 'double-struck':
        return transformationMaps.applyDoubleStruck(text)
      case 'fullwidth':
        return transformationMaps.applyFullwidth(text)
      case 'smallcaps':
        return transformationMaps.applySmallCaps(text)
      default:
        console.warn(`[TransformationEngine] Unknown style: ${style}`)
        return text
    }
  }

  /**
   * Get human-readable display name for transformation style
   * @param style - Transformation style
   * @returns Display name
   */
  getStyleDisplayName(style: TransformationStyle): string {
    const names: Record<TransformationStyle, string> = {
      strikethrough: 'Strikethrough',
      'upside-down': 'Upside Down',
      mirror: 'Mirror (Reversed)',
      bold: 'Bold',
      italic: 'Italic',
      'bold-italic': 'Bold Italic',
      script: 'Script (Cursive)',
      circled: 'Circled',
      squared: 'Squared',
      monospace: 'Monospace',
      'double-struck': 'Double-Struck',
      fullwidth: 'Fullwidth',
      smallcaps: 'Small Caps',
    }
    return names[style] || style
  }

  /**
   * Get example preview with fixed text for style selector
   * Shows what the transformation looks like before user selects it
   * @param style - Transformation style
   * @returns Transformed example text
   */
  getStyleExample(style: TransformationStyle): string {
    const FIXED_EXAMPLE = 'Example text'
    return this.transform(FIXED_EXAMPLE, style)
  }

  /**
   * Get all available transformation styles
   * @returns Array of transformation styles with metadata
   */
  getAllStyles(): Array<{
    value: TransformationStyle
    label: string
    example: string
  }> {
    const styles: TransformationStyle[] = [
      'strikethrough',
      'upside-down',
      'mirror',
      'bold',
      'italic',
      'bold-italic',
      'script',
      'circled',
      'squared',
      'monospace',
      'double-struck',
      'fullwidth',
      'smallcaps',
    ]

    return styles.map((style) => ({
      value: style,
      label: this.getStyleDisplayName(style),
      example: this.getStyleExample(style),
    }))
  }
}

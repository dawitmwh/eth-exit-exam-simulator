import { useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Eye, Code } from 'lucide-react';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function MathInput({ value, onChange, placeholder, label }: MathInputProps) {
  const [showPreview, setShowPreview] = useState(true);

  const commonSymbols = [
    { label: 'Fraction', syntax: '\\frac{a}{b}' },
    { label: 'Square Root', syntax: '\\sqrt{x}' },
    { label: 'Nth Root', syntax: '\\sqrt[n]{x}' },
    { label: 'Exponent', syntax: 'x^{n}' },
    { label: 'Subscript', syntax: 'x_{n}' },
    { label: 'Sum', syntax: '\\sum_{i=1}^{n}' },
    { label: 'Integral', syntax: '\\int_{a}^{b}' },
    { label: 'Limit', syntax: '\\lim_{x \\to \\infty}' },
    { label: 'Pi', syntax: '\\pi' },
    { label: 'Alpha', syntax: '\\alpha' },
    { label: 'Beta', syntax: '\\beta' },
    { label: 'Delta', syntax: '\\Delta' },
    { label: 'Theta', syntax: '\\theta' },
    { label: 'Lambda', syntax: '\\lambda' },
    { label: 'Plus/Minus', syntax: '\\pm' },
    { label: 'Multiply', syntax: '\\times' },
    { label: 'Divide', syntax: '\\div' },
    { label: 'Not Equal', syntax: '\\neq' },
    { label: 'Less/Equal', syntax: '\\leq' },
    { label: 'Greater/Equal', syntax: '\\geq' },
    { label: 'Infinity', syntax: '\\infty' },
  ];

  const insertSymbol = (syntax: string) => {
    onChange(value + syntax);
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium">{label}</label>}

      <Tabs defaultValue={showPreview ? "preview" : "code"} onValueChange={(v) => setShowPreview(v === "preview")}>
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="preview">
              <Eye className="size-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="size-4" />
              LaTeX
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="code" className="mt-0">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Enter LaTeX equation (e.g., \\frac{a}{b})"}
            className="font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="border rounded-md p-4 min-h-[60px] bg-background flex items-center justify-center">
            {value ? (
              <div className="overflow-x-auto max-w-full">
                <BlockMath math={value} errorColor="#d4183d" />
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Preview will appear here</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="border rounded-lg p-3 bg-muted/50">
        <p className="text-xs font-medium mb-2 text-muted-foreground">Quick Insert:</p>
        <div className="flex flex-wrap gap-1.5">
          {commonSymbols.map((symbol) => (
            <Button
              key={symbol.syntax}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertSymbol(symbol.syntax)}
              className="text-xs h-7"
            >
              {symbol.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          <strong>Tip:</strong> Use LaTeX syntax. Example: <code className="bg-muted px-1 rounded">x = \frac{'{-b \\pm \\sqrt{b^2-4ac}}'}{'{2a}'}</code>
        </p>
      </div>
    </div>
  );
}

export function MathRenderer({ math, inline = false }: { math: string; inline?: boolean }) {
  if (!math) return null;

  try {
    return inline ? (
      <InlineMath math={math} errorColor="#d4183d" />
    ) : (
      <BlockMath math={math} errorColor="#d4183d" />
    );
  } catch (error) {
    return <span className="text-destructive text-sm">Invalid LaTeX: {math}</span>;
  }
}

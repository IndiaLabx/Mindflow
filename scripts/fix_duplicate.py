with open('src/features/quiz/components/Dashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace('import { Loader2, ChevronRight } from "lucide-react";\n', 'import { Loader2 } from "lucide-react";\n')

with open('src/features/quiz/components/Dashboard.tsx', 'w') as f:
    f.write(content)

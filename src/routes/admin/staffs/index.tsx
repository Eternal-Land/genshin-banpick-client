import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/staffs/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/staffs/"!</div>
}

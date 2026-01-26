import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/staffs/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/staffs/create"!</div>
}

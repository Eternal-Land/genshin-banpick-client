import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/admin/staffs/$staffId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/admin/staffs/$staffId"!</div>
}

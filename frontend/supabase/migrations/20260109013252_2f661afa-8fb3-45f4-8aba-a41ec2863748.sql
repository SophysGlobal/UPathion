-- Assign admin role to the existing admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('f06e40a9-89bf-41a9-92d6-6d4d2f9c56f9', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
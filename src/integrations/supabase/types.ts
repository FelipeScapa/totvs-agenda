export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      atendimento_anexos: {
        Row: {
          atendimento_id: string
          data_criacao: string
          id: string
          nome: string
          path: string
          tamanho: number
          tipo: string
        }
        Insert: {
          atendimento_id: string
          data_criacao?: string
          id: string
          nome: string
          path: string
          tamanho?: number
          tipo?: string
        }
        Update: {
          atendimento_id?: string
          data_criacao?: string
          id?: string
          nome?: string
          path?: string
          tamanho?: number
          tipo?: string
        }
        Relationships: []
      }
      atendimentos: {
        Row: {
          cliente: string
          data: string
          data_atualizacao: string
          data_criacao: string
          descricao: string
          duracao_horas: number
          hora_fim: string
          hora_inicio: string
          id: string
          intervalo_fim: string | null
          intervalo_inicio: string | null
          modalidade: string
          observacoes: string
          servico_id: string | null
          status: string
          tem_traslado: boolean
          tipo: string
          traslado_destino: string
          traslado_km: number
          traslado_obs: string
          traslado_origem: string
          traslado_retorno: string | null
          traslado_saida: string | null
          traslado_valor: number
          valor_almoco: number
          valor_cafe: number
          valor_jantar: number
        }
        Insert: {
          cliente: string
          data: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string
          duracao_horas?: number
          hora_fim: string
          hora_inicio: string
          id: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          modalidade?: string
          observacoes?: string
          servico_id?: string | null
          status: string
          tem_traslado?: boolean
          tipo: string
          traslado_destino?: string
          traslado_km?: number
          traslado_obs?: string
          traslado_origem?: string
          traslado_retorno?: string | null
          traslado_saida?: string | null
          traslado_valor?: number
          valor_almoco?: number
          valor_cafe?: number
          valor_jantar?: number
        }
        Update: {
          cliente?: string
          data?: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string
          duracao_horas?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
          intervalo_fim?: string | null
          intervalo_inicio?: string | null
          modalidade?: string
          observacoes?: string
          servico_id?: string | null
          status?: string
          tem_traslado?: boolean
          tipo?: string
          traslado_destino?: string
          traslado_km?: number
          traslado_obs?: string
          traslado_origem?: string
          traslado_retorno?: string | null
          traslado_saida?: string | null
          traslado_valor?: number
          valor_almoco?: number
          valor_cafe?: number
          valor_jantar?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          data_criacao: string
          id: string
          nome: string
        }
        Insert: {
          data_criacao?: string
          id: string
          nome: string
        }
        Update: {
          data_criacao?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      feriados: {
        Row: {
          data_criacao: string
          data_fim: string
          data_inicio: string
          descricao: string
          id: string
          tipo: string
        }
        Insert: {
          data_criacao?: string
          data_fim: string
          data_inicio: string
          descricao?: string
          id: string
          tipo: string
        }
        Update: {
          data_criacao?: string
          data_fim?: string
          data_inicio?: string
          descricao?: string
          id?: string
          tipo?: string
        }
        Relationships: []
      }
      pendencias: {
        Row: {
          cliente: string
          data_atualizacao: string
          data_criacao: string
          descricao: string
          id: string
          prazo: string | null
          prioridade: string
          status: string
          titulo: string
        }
        Insert: {
          cliente: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string
          id: string
          prazo?: string | null
          prioridade: string
          status: string
          titulo: string
        }
        Update: {
          cliente?: string
          data_atualizacao?: string
          data_criacao?: string
          descricao?: string
          id?: string
          prazo?: string | null
          prioridade?: string
          status?: string
          titulo?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          data_criacao: string
          id: string
          nome: string
          valor_hora: number
        }
        Insert: {
          data_criacao?: string
          id: string
          nome: string
          valor_hora?: number
        }
        Update: {
          data_criacao?: string
          id?: string
          nome?: string
          valor_hora?: number
        }
        Relationships: []
      }
      tipos_atendimento: {
        Row: {
          id: string
          label: string
        }
        Insert: {
          id: string
          label: string
        }
        Update: {
          id?: string
          label?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
